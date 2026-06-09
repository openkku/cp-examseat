package compress

import (
	"bytes"
	"compress/flate"
	"compress/gzip"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/andybalholm/brotli"
	"github.com/klauspost/compress/zstd"
)

func TestSelectEncoding(t *testing.T) {
	tests := []struct {
		acceptEncoding string
		expected       string
	}{
		{"gzip, deflate, br", "br"}, // br is preferred over gzip, deflate (equal q-value, sorted by server pref)
		{"gzip;q=0.5, deflate;q=0.5, br;q=0.4, zstd;q=0.8", "zstd"}, // zstd has highest q
		{"gzip;q=0.5, deflate;q=0.5, br;q=0.9, zstd;q=0.8", "br"},   // br has highest q
		{"gzip", "gzip"},
		{"deflate", "deflate"},
		{"zstd", "zstd"},
		{"*", "zstd"}, // default preferred
		{"*, br;q=0", "zstd"}, // br rejected
		{"identity", ""},
		{"randomencoding", ""},
		{"gzip;q=0, deflate", "deflate"},
		{"", ""},
	}

	for _, tc := range tests {
		req, _ := http.NewRequest("GET", "/", nil)
		if tc.acceptEncoding != "" {
			req.Header.Set("Accept-Encoding", tc.acceptEncoding)
		}
		got := selectEncoding(req)
		if got != tc.expected {
			t.Errorf("selectEncoding(%q) = %q; want %q", tc.acceptEncoding, got, tc.expected)
		}
	}
}

func TestCompressBytes(t *testing.T) {
	input := []byte("hello world hello world hello world hello world hello world")

	encodings := []string{"zstd", "br", "gzip", "deflate"}
	for _, enc := range encodings {
		compressed, err := CompressBytes(input, enc)
		if err != nil {
			t.Fatalf("CompressBytes error for %s: %v", enc, err)
		}

		// Decompress and check
		var decompressed []byte
		switch enc {
		case "zstd":
			zr, err := zstd.NewReader(bytes.NewReader(compressed))
			if err != nil {
				t.Fatalf("failed to create zstd reader: %v", err)
			}
			decompressed, err = io.ReadAll(zr)
			if err != nil {
				t.Fatalf("failed to read zstd: %v", err)
			}
			zr.Close()
		case "br":
			br := brotli.NewReader(bytes.NewReader(compressed))
			decompressed, err = io.ReadAll(br)
			if err != nil {
				t.Fatalf("failed to read br: %v", err)
			}
		case "gzip":
			gr, err := gzip.NewReader(bytes.NewReader(compressed))
			if err != nil {
				t.Fatalf("failed to create gzip reader: %v", err)
			}
			decompressed, err = io.ReadAll(gr)
			if err != nil {
				t.Fatalf("failed to read gzip: %v", err)
			}
			gr.Close()
		case "deflate":
			fr := flate.NewReader(bytes.NewReader(compressed))
			decompressed, err = io.ReadAll(fr)
			if err != nil {
				t.Fatalf("failed to read deflate: %v", err)
			}
			fr.Close()
		}

		if string(decompressed) != string(input) {
			t.Errorf("decompressed content for %s mismatch: got %q; want %q", enc, string(decompressed), string(input))
		}
	}
}

func TestCompressMiddleware(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"hello": "world", "status": "ok", "message": "this is a test message to ensure it is longer than 512 bytes so that we trigger compression easily! Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."}`))
	})

	mw := CompressMiddleware(handler)

	// Test with compression (zstd)
	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Accept-Encoding", "zstd, br, gzip")
	rec := httptest.NewRecorder()

	mw.ServeHTTP(rec, req)

	res := rec.Result()
	if got := res.Header.Get("Content-Encoding"); got != "zstd" {
		t.Errorf("Content-Encoding = %q; want %q", got, "zstd")
	}
	if got := res.Header.Get("Vary"); got != "Accept-Encoding" {
		t.Errorf("Vary = %q; want %q", got, "Accept-Encoding")
	}

	body, _ := io.ReadAll(res.Body)
	zr, err := zstd.NewReader(bytes.NewReader(body))
	if err != nil {
		t.Fatalf("failed to init zstd reader: %v", err)
	}
	defer zr.Close()
	decompressed, _ := io.ReadAll(zr)

	expectedPrefix := `{"hello": "world"`
	if !bytes.HasPrefix(decompressed, []byte(expectedPrefix)) {
		t.Errorf("decompressed response content mismatch: got %q", string(decompressed))
	}
}

func TestCompressMiddlewareSkipNonCompressible(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "image/png")
		w.Write([]byte("fake png content fake png content fake png content"))
	})

	mw := CompressMiddleware(handler)
	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Accept-Encoding", "gzip")
	rec := httptest.NewRecorder()

	mw.ServeHTTP(rec, req)

	res := rec.Result()
	if got := res.Header.Get("Content-Encoding"); got != "" {
		t.Errorf("Content-Encoding should be empty, got %q", got)
	}
}
