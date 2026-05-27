package config

import "os"

// Config holds application configuration
type Config struct {
	Address  string // HTTP listen address
	DBPath   string // SQLite database path
	LogLevel string // Log level: debug, info, warn, error
}

// Load reads configuration from environment variables with sensible defaults
func Load() (*Config, error) {
	cfg := &Config{
		Address:  getEnv("RAG_EVAL_ADDRESS", "127.0.0.1:8772"),
		DBPath:   getEnv("RAG_EVAL_DB", "data/rag-eval.db"),
		LogLevel: getEnv("RAG_EVAL_LOG_LEVEL", "info"),
	}
	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
