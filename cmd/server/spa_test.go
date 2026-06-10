package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/fstest"
)

func TestServeSPA(t *testing.T) {
	// Create a mock filesystem representing the built frontend assets,
	// including some pre-compressed versions.
	mockFS := fstest.MapFS{
		"index.html": &fstest.MapFile{
			Data: []byte("<html>original index</html>"),
		},
		"index.html.gz": &fstest.MapFile{
			Data: []byte("gzip index"),
		},
		"index.html.br": &fstest.MapFile{
			Data: []byte("brotli index"),
		},
		"index.html.zst": &fstest.MapFile{
			Data: []byte("zstd index"),
		},
		"assets/index.js": &fstest.MapFile{
			Data: []byte("console.log('original');"),
		},
		"assets/index.js.br": &fstest.MapFile{
			Data: []byte("brotli js"),
		},
		"assets/style.css": &fstest.MapFile{
			Data: []byte("body { color: red; }"),
		},
		// No style.css.zst or br or gz
	}

	handler := serveSPA(mockFS)

	tests := []struct {
		name           string
		path           string
		acceptEncoding string
		expectedStatus int
		expectedBody   string
		expectedEnc    string
		expectedType   string
		expectedSniff  string
	}{
		{
			name:           "Serve original file when no Accept-Encoding header matches",
			path:           "/assets/index.js",
			acceptEncoding: "",
			expectedStatus: http.StatusOK,
			expectedBody:   "console.log('original');",
			expectedEnc:    "",
			expectedType:   "application/javascript",
			expectedSniff:  "nosniff",
		},
		{
			name:           "Negotiate ZSTD preference",
			path:           "/index.html",
			acceptEncoding: "zstd, br, gzip",
			expectedStatus: http.StatusOK,
			expectedBody:   "zstd index",
			expectedEnc:    "zstd",
			expectedType:   "text/html; charset=utf-8",
			expectedSniff:  "nosniff",
		},
		{
			name:           "Negotiate Brotli preference when Zstd missing",
			path:           "/assets/index.js",
			acceptEncoding: "gzip, br",
			expectedStatus: http.StatusOK,
			expectedBody:   "brotli js",
			expectedEnc:    "br",
			expectedType:   "application/javascript",
			expectedSniff:  "nosniff",
		},
		{
			name:           "Negotiate Gzip fallback",
			path:           "/index.html",
			acceptEncoding: "gzip",
			expectedStatus: http.StatusOK,
			expectedBody:   "gzip index",
			expectedEnc:    "gzip",
			expectedType:   "text/html; charset=utf-8",
			expectedSniff:  "nosniff",
		},
		{
			name:           "Fallback to original when pre-compressed missing but accepted",
			path:           "/assets/style.css",
			acceptEncoding: "br, gzip",
			expectedStatus: http.StatusOK,
			expectedBody:   "body { color: red; }",
			expectedEnc:    "",
			expectedType:   "text/css; charset=utf-8",
			expectedSniff:  "nosniff",
		},
		{
			name:           "SPA routing: fallback to index.html for non-existent path",
			path:           "/some/random/route",
			acceptEncoding: "br",
			expectedStatus: http.StatusOK,
			expectedBody:   "brotli index", // fallbacks to index.html.br
			expectedEnc:    "br",
			expectedType:   "text/html; charset=utf-8",
			expectedSniff:  "nosniff",
		},
		{
			name:           "Exploit attempt: directory traversal gets sanitized and falls back to SPA index",
			path:           "/assets/../../etc/passwd",
			acceptEncoding: "",
			expectedStatus: http.StatusOK,
			expectedBody:   "<html>original index</html>", // Cleaned to /etc/passwd -> not found -> SPA fallback to index.html
			expectedEnc:    "",
			expectedType:   "text/html; charset=utf-8",
			expectedSniff:  "nosniff",
		},
		{
			name:           "Exploit attempt: directory traversal with dotdot/slash gets cleaned",
			path:           "/../etc/passwd",
			acceptEncoding: "zstd",
			expectedStatus: http.StatusOK,
			expectedBody:   "zstd index", // /../etc/passwd -> cleaned to /etc/passwd -> not found -> falls back to index.html.zst
			expectedEnc:    "zstd",
			expectedType:   "text/html; charset=utf-8",
			expectedSniff:  "nosniff",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", tc.path, nil)
			if tc.acceptEncoding != "" {
				req.Header.Set("Accept-Encoding", tc.acceptEncoding)
			}
			rec := httptest.NewRecorder()

			handler.ServeHTTP(rec, req)

			res := rec.Result()
			defer res.Body.Close()

			if res.StatusCode != tc.expectedStatus {
				t.Errorf("status = %d; want %d", res.StatusCode, tc.expectedStatus)
			}

			body, _ := io.ReadAll(res.Body)
			if string(body) != tc.expectedBody {
				t.Errorf("body = %q; want %q", string(body), tc.expectedBody)
			}

			if got := res.Header.Get("Content-Encoding"); got != tc.expectedEnc {
				t.Errorf("Content-Encoding = %q; want %q", got, tc.expectedEnc)
			}

			if got := res.Header.Get("Content-Type"); got != tc.expectedType {
				t.Errorf("Content-Type = %q; want %q", got, tc.expectedType)
			}

			if got := res.Header.Get("X-Content-Type-Options"); got != tc.expectedSniff {
				t.Errorf("X-Content-Type-Options = %q; want %q", got, tc.expectedSniff)
			}
		})
	}
}
