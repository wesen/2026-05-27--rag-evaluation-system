package source

import (
	"github.com/spf13/cobra"
)

// NewCommand creates the `source` command group
func NewCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "source",
		Short: "Manage document sources",
		Long:  `Create, list, and inspect document sources (filesystem directories, URLs, etc.).`,
	}

	cmd.AddCommand(newListCommand())
	cmd.AddCommand(newCreateCommand())
	cmd.AddCommand(newScanCommand())

	return cmd
}
