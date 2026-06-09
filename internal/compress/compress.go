package compress

import (
	"bytes"
	"compress/flate"
	"context"
	"io"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/andybalholm/brotli"
	"github.com/klauspost/compress/gzip"
	"github.com/klauspost/compress/zstd"
)

type contextKey string

const EncodingContextKey = contextKey("encoding")

// GetEncoding retrieves the negotiated compression encoding from the request context.
func GetEncoding(r *http.Request) string {
	if val, ok := r.Context().Value(EncodingContextKey).(string); ok {
		return val
	}
	return ""
}

// CompressBytes compresses the input bytes using the specified encoding.
func CompressBytes(input []byte, encoding string) ([]byte, error) {
	switch encoding {
	case "zstd":
		var buf bytes.Buffer
		zw, err := zstd.NewWriter(&buf, zstd.WithEncoderLevel(zstd.SpeedFastest))
		if err != nil {
			return nil, err
		}
		if _, err := zw.Write(input); err != nil {
			zw.Close()
			return nil, err
		}
		if err := zw.Close(); err != nil {
			return nil, err
		}
		return buf.Bytes(), nil
	case "br":
		var buf bytes.Buffer
		bw := brotli.NewWriterLevel(&buf, 4)
		if _, err := bw.Write(input); err != nil {
			bw.Close()
			return nil, err
		}
		if err := bw.Close(); err != nil {
			return nil, err
		}
		return buf.Bytes(), nil
	case "gzip":
		var buf bytes.Buffer
		gw, err := gzip.NewWriterLevel(&buf, gzip.BestSpeed)
		if err != nil {
			return nil, err
		}
		if _, err := gw.Write(input); err != nil {
			gw.Close()
			return nil, err
		}
		if err := gw.Close(); err != nil {
			return nil, err
		}
		return buf.Bytes(), nil
	case "deflate":
		var buf bytes.Buffer
		fw, err := flate.NewWriter(&buf, flate.BestSpeed)
		if err != nil {
			return nil, err
		}
		if _, err := fw.Write(input); err != nil {
			fw.Close()
			return nil, err
		}
		if err := fw.Close(); err != nil {
			return nil, err
		}
		return buf.Bytes(), nil
	default:
		return input, nil
	}
}

// CompressMiddleware negotiates content compression and wraps response writers accordingly.
func CompressMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		encoding := selectEncoding(r)

		// Inject the negotiated encoding into request context for handler use.
		ctx := context.WithValue(r.Context(), EncodingContextKey, encoding)
		r = r.WithContext(ctx)

		if encoding == "" {
			next.ServeHTTP(w, r)
			return
		}

		cw := &compressResponseWriter{
			ResponseWriter: w,
			encoding:       encoding,
		}
		defer cw.Close()

		next.ServeHTTP(cw, r)
	})
}

type compressResponseWriter struct {
	http.ResponseWriter
	w             io.WriteCloser
	encoding      string
	statusCode    int
	headerWritten bool
}

func (cw *compressResponseWriter) WriteHeader(code int) {
	if cw.headerWritten {
		return
	}
	cw.statusCode = code
}

func (cw *compressResponseWriter) Write(b []byte) (int, error) {
	if !cw.headerWritten {
		cw.initCompression(b)
	}
	if cw.w != nil {
		return cw.w.Write(b)
	}
	return cw.ResponseWriter.Write(b)
}

func (cw *compressResponseWriter) initCompression(firstChunk []byte) {
	cw.headerWritten = true

	// If handler already compressed response (e.g. pre-compressed cache), skip compression.
	if cw.Header().Get("Content-Encoding") != "" {
		if cw.statusCode != 0 {
			cw.ResponseWriter.WriteHeader(cw.statusCode)
		}
		return
	}

	contentType := cw.Header().Get("Content-Type")
	if contentType == "" && len(firstChunk) > 0 {
		contentType = http.DetectContentType(firstChunk)
		cw.Header().Set("Content-Type", contentType)
	}

	if !isCompressible(contentType) {
		if cw.statusCode != 0 {
			cw.ResponseWriter.WriteHeader(cw.statusCode)
		}
		return
	}

	if clStr := cw.Header().Get("Content-Length"); clStr != "" {
		if cl, err := strconv.Atoi(clStr); err == nil && cl < 512 {
			if cw.statusCode != 0 {
				cw.ResponseWriter.WriteHeader(cw.statusCode)
			}
			return
		}
	}

	cw.Header().Set("Vary", "Accept-Encoding")

	switch cw.encoding {
	case "zstd":
		cw.Header().Set("Content-Encoding", "zstd")
		cw.Header().Del("Content-Length")
		if cw.statusCode != 0 {
			cw.ResponseWriter.WriteHeader(cw.statusCode)
		} else {
			cw.ResponseWriter.WriteHeader(http.StatusOK)
		}
		zw, _ := zstd.NewWriter(cw.ResponseWriter, zstd.WithEncoderLevel(zstd.SpeedFastest))
		cw.w = zw
	case "br":
		cw.Header().Set("Content-Encoding", "br")
		cw.Header().Del("Content-Length")
		if cw.statusCode != 0 {
			cw.ResponseWriter.WriteHeader(cw.statusCode)
		} else {
			cw.ResponseWriter.WriteHeader(http.StatusOK)
		}
		bw := brotli.NewWriterLevel(cw.ResponseWriter, 4)
		cw.w = bw
	case "gzip":
		cw.Header().Set("Content-Encoding", "gzip")
		cw.Header().Del("Content-Length")
		if cw.statusCode != 0 {
			cw.ResponseWriter.WriteHeader(cw.statusCode)
		} else {
			cw.ResponseWriter.WriteHeader(http.StatusOK)
		}
		gw, _ := gzip.NewWriterLevel(cw.ResponseWriter, gzip.BestSpeed)
		cw.w = gw
	case "deflate":
		cw.Header().Set("Content-Encoding", "deflate")
		cw.Header().Del("Content-Length")
		if cw.statusCode != 0 {
			cw.ResponseWriter.WriteHeader(cw.statusCode)
		} else {
			cw.ResponseWriter.WriteHeader(http.StatusOK)
		}
		fw, _ := flate.NewWriter(cw.ResponseWriter, flate.BestSpeed)
		cw.w = fw
	default:
		if cw.statusCode != 0 {
			cw.ResponseWriter.WriteHeader(cw.statusCode)
		}
	}
}

func (cw *compressResponseWriter) Close() error {
	if !cw.headerWritten {
		cw.initCompression(nil)
	}
	if cw.w != nil {
		return cw.w.Close()
	}
	return nil
}

func (cw *compressResponseWriter) Flush() {
	if !cw.headerWritten {
		cw.initCompression(nil)
	}
	if f, ok := cw.w.(interface{ Flush() error }); ok {
		f.Flush()
	} else if f, ok := cw.w.(interface{ Flush() }); ok {
		f.Flush()
	}
	if f, ok := cw.ResponseWriter.(http.Flusher); ok {
		f.Flush()
	}
}

func isCompressible(contentType string) bool {
	if contentType == "" {
		return false
	}
	parts := strings.Split(contentType, ";")
	ct := strings.TrimSpace(strings.ToLower(parts[0]))

	if strings.HasPrefix(ct, "text/") {
		return true
	}

	switch ct {
	case "application/json",
		"application/javascript",
		"application/x-javascript",
		"application/xml",
		"application/atom+xml",
		"application/rss+xml",
		"image/svg+xml",
		"image/bmp",
		"image/x-icon",
		"application/x-font-ttf",
		"font/opentype",
		"application/vnd.ms-fontobject",
		"application/font-woff",
		"application/font-woff2":
		return true
	}

	return false
}

func serverPreference(name string) int {
	switch name {
	case "zstd":
		return 4
	case "br":
		return 3
	case "gzip":
		return 2
	case "deflate":
		return 1
	default:
		return 0
	}
}

func selectEncoding(r *http.Request) string {
	acceptEncoding := r.Header.Get("Accept-Encoding")
	if acceptEncoding == "" {
		return ""
	}

	type spec struct {
		name string
		q    float64
	}

	var specs []spec
	parts := strings.Split(acceptEncoding, ",")
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}

		name := part
		q := 1.0

		if idx := strings.Index(part, ";"); idx != -1 {
			name = strings.TrimSpace(part[:idx])
			qpart := strings.TrimSpace(part[idx+1:])
			if strings.HasPrefix(qpart, "q=") {
				if val, err := strconv.ParseFloat(qpart[2:], 64); err == nil {
					q = val
				}
			}
		}

		name = strings.ToLower(name)
		specs = append(specs, spec{name: name, q: q})
	}

	sort.Slice(specs, func(i, j int) bool {
		if specs[i].q != specs[j].q {
			return specs[i].q > specs[j].q
		}
		return serverPreference(specs[i].name) > serverPreference(specs[j].name)
	})

	for _, s := range specs {
		if s.q == 0 {
			continue
		}
		switch s.name {
		case "zstd":
			return "zstd"
		case "br":
			return "br"
		case "gzip":
			return "gzip"
		case "deflate":
			return "deflate"
		case "*":
			rejected := make(map[string]bool)
			for _, other := range specs {
				if other.q == 0 {
					rejected[other.name] = true
				}
			}
			if !rejected["zstd"] {
				return "zstd"
			}
			if !rejected["br"] {
				return "br"
			}
			if !rejected["gzip"] {
				return "gzip"
			}
			if !rejected["deflate"] {
				return "deflate"
			}
		}
	}

	return ""
}
