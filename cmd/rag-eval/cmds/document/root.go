package document

import (
	"github.com/spf13/cobra"
)

// NewCommand creates the `document` command group
func NewCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "document",
		Short: "Inspect and manage documents",
		Long:  `List, inspect, and manage documents in the RAG evaluation database.`,
	}

	cmd.AddCommand(newListCommand())
	cmd.AddCommand(newGetCommand())
	cmd.AddCommand(newChunksCommand())
	cmd.AddCommand(newPreprocessCommand())

	return cmd
}
