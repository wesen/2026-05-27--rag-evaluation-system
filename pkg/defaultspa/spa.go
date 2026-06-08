package defaultspa

import (
	"embed"
	"io/fs"
	"net/http"
	"strings"
)

//go:embed all:dist
var embeddedDist embed.FS

// FS returns the built default WidgetRenderer SPA rooted at its public asset directory.
func FS() fs.FS {
	publicFS, err := fs.Sub(embeddedDist, "dist")
	if err != nil {
		panic(err)
	}
	return publicFS
}

// Handler serves the embedded default WidgetRenderer SPA with index.html fallback
// for client-side routes.
func Handler() http.Handler {
	return SPAHandler(FS())
}

// SPAHandler serves files from publicFS and falls back to index.html for unknown
// paths. It is intentionally local to defaultspa so widgetserver can depend on
// defaultspa without creating an import cycle.
func SPAHandler(publicFS fs.FS) http.Handler {
	fileServer := http.FileServer(http.FS(publicFS))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}
		if f, err := publicFS.Open(path); err == nil {
			_ = f.Close()
			fileServer.ServeHTTP(w, r)
			return
		}
		index, err := fs.ReadFile(publicFS, "index.html")
		if err != nil {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write(index)
	})
}
