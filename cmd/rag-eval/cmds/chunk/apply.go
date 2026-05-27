package chunk

import (
	"context"
	"fmt"

	"github.com/go-go-golems/glazed/pkg/cli"
	"github.com/go-go-golems/glazed/pkg/cmds"
	"github.com/go-go-golems/glazed/pkg/cmds/fields"
	"github.com/go-go-golems/glazed/pkg/cmds/schema"
	"github.com/go-go-golems/glazed/pkg/cmds/values"
	"github.com/go-go-golems/glazed/pkg/middlewares"
	"github.com/go-go-golems/glazed/pkg/settings"
	"github.com/go-go-golems/glazed/pkg/types"
	cmds2 "github.com/go-go-golems/rag-evaluation-system/cmd/rag-eval/cmds"
	chunkservice "github.com/go-go-golems/rag-evaluation-system/internal/services/chunking"
	"github.com/spf13/cobra"
)

type ApplyCommand struct {
	*cmds.CommandDescription
}

var _ cmds.GlazeCommand = (*ApplyCommand)(nil)

type ApplySettings struct {
	DB           string `glazed:"db"`
	DocID        string `glazed:"doc-id"`
	Strategy     string `glazed:"strategy"`
	ChunkSize    int    `glazed:"chunk-size"`
	Overlap      int    `glazed:"overlap"`
	StrategyName string `glazed:"strategy-name"`
}

func newApplyCommand() *cobra.Command {
	glazedCmd, err := newApplyGlazeCommand()
	cobra.CheckErr(err)

	cobraCmd, err := cli.BuildCobraCommand(glazedCmd,
		cli.WithParserConfig(cli.CobraParserConfig{AppName: "rag-eval"}),
	)
	cobra.CheckErr(err)

	return cobraCmd
}

func newApplyGlazeCommand() (*ApplyCommand, error) {
	glazedSection, err := settings.NewGlazedSchema(
		settings.WithOutputSectionOptions(
			schema.WithDefaults(map[string]interface{}{
				"output": "table",
			}),
		),
	)
	if err != nil {
		return nil, err
	}

	return &ApplyCommand{
		CommandDescription: cmds.NewCommandDescription(
			"apply",
			cmds.WithShort("Apply a chunking strategy to a document"),
			cmds.WithLong(`Apply a chunking strategy to a document and store the resulting chunks.

Available strategies:
  fixed            - Fixed-size character chunks with overlap
  sentence         - Sentence-boundary chunks with overlap
  markdown-heading - Split on markdown headings, sub-chunk large sections

Examples:
  rag-eval chunk apply --doc-id doc-abc --strategy fixed --chunk-size 500 --overlap 50
  rag-eval chunk apply --doc-id doc-abc --strategy sentence --chunk-size 1000
  rag-eval chunk apply --doc-id doc-abc --strategy markdown-heading --output json
`),
			cmds.WithFlags(
				fields.New(
					"db",
					fields.TypeString,
					fields.WithDefault("data/rag-eval.db"),
					fields.WithHelp("Path to the SQLite database"),
				),
				fields.New(
					"doc-id",
					fields.TypeString,
					fields.WithHelp("Document ID to chunk"),
				),
				fields.New(
					"strategy",
					fields.TypeString,
					fields.WithDefault("fixed"),
					fields.WithHelp("Chunking strategy (fixed, sentence, markdown-heading)"),
				),
				fields.New(
					"chunk-size",
					fields.TypeInteger,
					fields.WithDefault(500),
					fields.WithHelp("Target chunk size in characters"),
				),
				fields.New(
					"overlap",
					fields.TypeInteger,
					fields.WithDefault(50),
					fields.WithHelp("Overlap between chunks in characters"),
				),
				fields.New(
					"strategy-name",
					fields.TypeString,
					fields.WithDefault(""),
					fields.WithHelp("Human-readable name for this strategy config (auto-generated if empty)"),
				),
			),
			cmds.WithSections(glazedSection),
		),
	}, nil
}

func (c *ApplyCommand) RunIntoGlazeProcessor(
	ctx context.Context,
	vals *values.Values,
	gp middlewares.Processor,
) error {
	s := &ApplySettings{}
	if err := vals.DecodeSectionInto(schema.DefaultSlug, s); err != nil {
		return err
	}

	if s.DocID == "" {
		return fmt.Errorf("--doc-id is required")
	}

	queries, err := cmds2.OpenDBAtPath(s.DB)
	if err != nil {
		return err
	}
	defer queries.Close()

	service := chunkservice.NewService(queries)
	result, err := service.Apply(ctx, chunkservice.ApplyRequest{
		DocumentID:   s.DocID,
		Strategy:     s.Strategy,
		ChunkSize:    s.ChunkSize,
		Overlap:      s.Overlap,
		StrategyName: s.StrategyName,
	})
	if err != nil {
		return err
	}

	for _, ch := range result.Chunks {
		row := types.NewRow(
			types.MRP("id", ch.ID),
			types.MRP("strategy_id", result.StrategyID),
			types.MRP("chunk_index", ch.ChunkIndex),
			types.MRP("token_count", ch.TokenCount),
			types.MRP("start_offset", ch.StartOffset),
			types.MRP("end_offset", ch.EndOffset),
			types.MRP("text_preview", truncate(ch.Text, 80)),
		)
		if err := gp.AddRow(ctx, row); err != nil {
			return err
		}
	}

	summaryRow := types.NewRow(
		types.MRP("id", "_summary"),
		types.MRP("strategy_id", result.StrategyID),
		types.MRP("chunk_index", result.ChunkCount),
		types.MRP("token_count", 0),
		types.MRP("start_offset", 0),
		types.MRP("end_offset", 0),
		types.MRP("text_preview", fmt.Sprintf("chunked into %d chunks using %s", result.ChunkCount, result.StrategyID)),
	)
	return gp.AddRow(ctx, summaryRow)
}

func truncate(s string, maxRunes int) string {
	runes := []rune(s)
	if len(runes) <= maxRunes {
		return s
	}
	return string(runes[:maxRunes]) + "..."
}
