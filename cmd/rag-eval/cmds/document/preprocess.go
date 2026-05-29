package document

import (
	"encoding/json"
	"fmt"

	cmds2 "github.com/go-go-golems/rag-evaluation-system/cmd/rag-eval/cmds"
	documentprocessing "github.com/go-go-golems/rag-evaluation-system/internal/services/documentprocessing"
	"github.com/spf13/cobra"
)

type preprocessOptions struct {
	db            string
	documentID    string
	artifactType  string
	promptVersion string
	provider      string
	model         string
	force         bool
}

func newPreprocessCommand() *cobra.Command {
	opts := &preprocessOptions{}
	cmd := &cobra.Command{
		Use:   "preprocess",
		Short: "Create a non-destructive document processing artifact",
		Long: `Create a document-level preprocessing artifact without modifying documents.content_text.

This Phase 3 command intentionally supports the deterministic fake provider first.
Live LLM providers are reserved for the bounded live-provider smoke phase.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			queries, err := cmds2.OpenDBAtPath(opts.db)
			if err != nil {
				return err
			}
			defer queries.Close()
			if opts.provider != "fake" {
				return fmt.Errorf("unsupported document processing provider %q; only fake is available before live provider smoke", opts.provider)
			}
			result, err := documentprocessing.NewService(queries).Process(cmd.Context(), documentprocessing.ProcessRequest{
				DocumentID:    opts.documentID,
				ArtifactType:  opts.artifactType,
				PromptVersion: opts.promptVersion,
				Provider:      documentprocessing.FakeProvider{ProviderName: opts.provider, ModelName: opts.model},
				Force:         opts.force,
			})
			if err != nil {
				return err
			}
			b, err := json.MarshalIndent(result, "", "  ")
			if err != nil {
				return err
			}
			fmt.Fprintln(cmd.OutOrStdout(), string(b))
			return nil
		},
	}
	cmd.Flags().StringVar(&opts.db, "db", "data/rag-eval.db", "Path to the SQLite database")
	cmd.Flags().StringVar(&opts.documentID, "document-id", "", "Document ID to preprocess")
	cmd.Flags().StringVar(&opts.artifactType, "artifact-type", "clean_text", "Artifact type to produce")
	cmd.Flags().StringVar(&opts.promptVersion, "prompt-version", "v1", "Prompt version identity")
	cmd.Flags().StringVar(&opts.provider, "provider", "fake", "Document processing provider; currently only fake")
	cmd.Flags().StringVar(&opts.model, "model", "fake-document-processor", "Document processing model identity")
	cmd.Flags().BoolVar(&opts.force, "force", false, "Recompute even if an artifact is fresh")
	_ = cmd.MarkFlagRequired("document-id")
	return cmd
}
