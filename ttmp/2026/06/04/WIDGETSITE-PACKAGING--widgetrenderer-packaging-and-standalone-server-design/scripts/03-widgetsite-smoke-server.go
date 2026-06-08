package main

import (
	"context"
	"flag"
	"log"

	"github.com/go-go-golems/rag-evaluation-system/pkg/widgetrunner"
	"github.com/go-go-golems/rag-evaluation-system/pkg/widgetserver"
)

func main() {
	addr := flag.String("addr", "127.0.0.1:8897", "address to listen on")
	scripts := flag.String("scripts", "", "directory containing widget JS scripts")
	flag.Parse()

	if *scripts == "" {
		log.Fatal("--scripts is required")
	}

	ctx := context.Background()
	runner, err := widgetrunner.New(ctx, widgetrunner.Config{ScriptDirs: []string{*scripts}, Dev: true})
	if err != nil {
		log.Fatalf("create runner: %v", err)
	}
	defer func() { _ = runner.Close(context.Background()) }()

	server, err := widgetserver.New(widgetserver.Config{
		Addr:         *addr,
		Runner:       runner,
		Dev:          true,
		FrontendMode: widgetserver.FrontendEmbedded,
	})
	if err != nil {
		log.Fatalf("create server: %v", err)
	}
	log.Printf("widget smoke server listening on http://%s", *addr)
	if err := server.Run(ctx); err != nil {
		log.Fatalf("run server: %v", err)
	}
}
