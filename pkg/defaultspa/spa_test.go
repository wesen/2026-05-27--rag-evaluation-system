package defaultspa

import (
	"io/fs"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestFSContainsBuiltApp(t *testing.T) {
	publicFS := FS()
	index, err := fs.ReadFile(publicFS, "index.html")
	if err != nil {
		t.Fatalf("read index.html: %v", err)
	}
	if !strings.Contains(string(index), `id="root"`) {
		t.Fatalf("index.html does not contain root element: %s", string(index))
	}
	entries, err := fs.ReadDir(publicFS, "assets")
	if err != nil {
		t.Fatalf("read assets: %v", err)
	}
	if len(entries) == 0 {
		t.Fatalf("assets directory is empty")
	}
}

func TestHandlerServesIndexAndFallsBack(t *testing.T) {
	handler := Handler()
	for _, path := range []string{"/", "/pages/demo"} {
		req := httptest.NewRequest(http.MethodGet, path, nil)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("GET %s = %d, want 200 body=%s", path, rec.Code, rec.Body.String())
		}
		if !strings.Contains(rec.Body.String(), `id="root"`) {
			t.Fatalf("GET %s did not return app index: %s", path, rec.Body.String())
		}
	}
}
