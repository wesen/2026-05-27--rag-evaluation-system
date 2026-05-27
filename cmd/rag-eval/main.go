package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-go-golems/rag-evaluation-system/internal/api"
	"github.com/go-go-golems/rag-evaluation-system/internal/config"
	"github.com/go-go-golems/rag-evaluation-system/internal/db"
	"github.com/go-go-golems/rag-evaluation-system/internal/web"
	"github.com/rs/zerolog"
	zerolog_log "github.com/rs/zerolog/log"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to load config: %v\n", err)
		os.Exit(1)
	}

	// Configure logging
	zerolog.SetGlobalLevel(parseLogLevel(cfg.LogLevel))
	zerolog_log.Logger = zerolog.New(zerolog.ConsoleWriter{Out: os.Stderr}).With().Timestamp().Logger()

	// Open SQLite database
	database, err := db.OpenDB(cfg.DBPath)
	if err != nil {
		zerolog_log.Fatal().Err(err).Str("path", cfg.DBPath).Msg("failed to open database")
	}
	defer database.Close()

	// Run migrations
	if err := db.Migrate(database); err != nil {
		zerolog_log.Fatal().Err(err).Msg("failed to run migrations")
	}

	// Wire HTTP handlers
	mux := http.NewServeMux()

	// API routes
	api.RegisterHandlers(mux, database)

	// Serve embedded SPA
	mux.Handle("/", web.SPAHandler())

	// Start server
	server := &http.Server{
		Addr:         cfg.Address,
		Handler:      mux,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	go func() {
		zerolog_log.Info().Str("addr", cfg.Address).Msg("starting RAG evaluation server")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			zerolog_log.Fatal().Err(err).Msg("server failed")
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	zerolog_log.Info().Msg("shutting down server")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		zerolog_log.Error().Err(err).Msg("server shutdown failed")
	}
}

func parseLogLevel(level string) zerolog.Level {
	switch level {
	case "debug":
		return zerolog.DebugLevel
	case "info":
		return zerolog.InfoLevel
	case "warn":
		return zerolog.WarnLevel
	case "error":
		return zerolog.ErrorLevel
	default:
		return zerolog.InfoLevel
	}
}
