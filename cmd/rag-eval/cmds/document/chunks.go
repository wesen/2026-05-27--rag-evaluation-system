package document

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
	"github.com/spf13/cobra"
)

type ChunksCommand struct {
	*cmds.CommandDescription
}

var _ cmds.GlazeCommand = (*ChunksCommand)(nil)

type ChunksSettings struct {
	DB    string `glazed:"db"`
	DocID string `glazed:"doc-id"`
}

func newChunksCommand() *cobra.Command {
	glazedCmd, err := newChunksGlazeCommand()
	cobra.CheckErr(err)

	cobraCmd, err := cli.BuildCobraCommand(glazedCmd,
		cli.WithParserConfig(cli.CobraParserConfig{AppName: "rag-eval"}),
	)
	cobra.CheckErr(err)

	return cobraCmd
}

func newChunksGlazeCommand() (*ChunksCommand, error) {
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

	return &ChunksCommand{
		CommandDescription: cmds.NewCommandDescription(
			"chunks",
			cmds.WithShort("List chunks for a document"),
			cmds.WithLong(`List all chunks for a specific document.

Examples:
  rag-eval document chunks --doc-id doc-abc123
  rag-eval document chunks --doc-id doc-abc123 --output json
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
					fields.WithHelp("Document ID to retrieve chunks for"),
				),
			),
			cmds.WithSections(glazedSection),
		),
	}, nil
}

func (c *ChunksCommand) RunIntoGlazeProcessor(
	ctx context.Context,
	vals *values.Values,
	gp middlewares.Processor,
) error {
	s := &ChunksSettings{}
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

	chunks, err := queries.ListChunks(s.DocID)
	if err != nil {
		return err
	}

	for _, ch := range chunks {
		row := types.NewRow(
			types.MRP("id", ch.ID),
			types.MRP("chunk_index", ch.ChunkIndex),
			types.MRP("text", ch.Text),
			types.MRP("token_count", ch.TokenCount),
			types.MRP("start_offset", ch.StartOffset),
			types.MRP("end_offset", ch.EndOffset),
		)
		if err := gp.AddRow(ctx, row); err != nil {
			return err
		}
	}

	return nil
}
