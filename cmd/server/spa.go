package main

import (
	"io"
	"io/fs"
	"net/http"
	"path"
	"strconv"
	"strings"
)

var mimeTypes = map[string]string{
	".html": "text/html; charset=utf-8",
	".css":  "text/css; charset=utf-8",
	".js":   "application/javascript",
	".mjs":  "application/javascript",
	".json": "application/json",
	".svg":  "image/svg+xml",
	".png":  "image/png",
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".gif":  "image/gif",
	".ico":  "image/x-icon",
	".txt":  "text/plain; charset=utf-8",
	".woff": "font/woff",
	".woff2": "font/woff2",
	".ttf":  "font/ttf",
	".otf":  "font/otf",
}

func getMimeType(filePath string) string {
	ext := strings.ToLower(path.Ext(filePath))
	if t, ok := mimeTypes[ext]; ok {
		return t
	}
	return "application/octet-stream"
}

// serveSPA returns an http.HandlerFunc that serves static assets from distFS.
// It supports content-negotiation for zstd, br, and gzip pre-compressed assets,
// falling back to uncompressed serving or SPA index.html routing where appropriate.
func serveSPA(distFS fs.FS) http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		// Set basic security headers
		w.Header().Set("X-Content-Type-Options", "nosniff")

		cleanPath := strings.TrimPrefix(path.Clean(req.URL.Path), "/")
		if cleanPath == "" {
			cleanPath = "index.html"
		}

		targetPath := cleanPath
		file, err := distFS.Open(targetPath)
		if err != nil {
			// Fallback to index.html for SPA routing
			targetPath = "index.html"
			file, err = distFS.Open(targetPath)
			if err != nil {
				http.Error(w, "Not Found", http.StatusNotFound)
				return
			}
		}

		stat, err := file.Stat()
		if err != nil || stat.IsDir() {
			if err == nil {
				file.Close()
			}
			// Fallback to index.html for SPA routing
			targetPath = "index.html"
			file, err = distFS.Open(targetPath)
			if err != nil {
				http.Error(w, "Not Found", http.StatusNotFound)
				return
			}
			stat, err = file.Stat()
			if err != nil {
				file.Close()
				http.Error(w, "Not Found", http.StatusNotFound)
				return
			}
		}
		file.Close()

		// Negotiate pre-compression based on Accept-Encoding
		acceptEncoding := req.Header.Get("Accept-Encoding")
		var servePath string
		var encoding string

		// Order of preference: zstd > br > gzip
		if strings.Contains(strings.ToLower(acceptEncoding), "zstd") {
			zstdPath := targetPath + ".zst"
			if f, err := distFS.Open(zstdPath); err == nil {
				f.Close()
				servePath = zstdPath
				encoding = "zstd"
			}
		}
		if servePath == "" && strings.Contains(strings.ToLower(acceptEncoding), "br") {
			brPath := targetPath + ".br"
			if f, err := distFS.Open(brPath); err == nil {
				f.Close()
				servePath = brPath
				encoding = "br"
			}
		}
		if servePath == "" && strings.Contains(strings.ToLower(acceptEncoding), "gzip") {
			gzPath := targetPath + ".gz"
			if f, err := distFS.Open(gzPath); err == nil {
				f.Close()
				servePath = gzPath
				encoding = "gzip"
			}
		}

		// Fall back to original file if no pre-compressed option exists or is accepted
		if servePath == "" {
			servePath = targetPath
		}

		f, err := distFS.Open(servePath)
		if err != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		defer f.Close()

		d, err := f.Stat()
		if err != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		// Ensure the Content-Type header is strictly set based on the original requested file extension
		w.Header().Set("Content-Type", getMimeType(targetPath))

		if encoding != "" {
			w.Header().Set("Content-Encoding", encoding)
		}
		w.Header().Set("Vary", "Accept-Encoding")

		if rs, ok := f.(io.ReadSeeker); ok {
			http.ServeContent(w, req, targetPath, d.ModTime(), rs)
		} else {
			// Fallback for non-ReadSeeker files (though embed.FS always implements ReadSeeker)
			data, err := io.ReadAll(f)
			if err != nil {
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Length", strconv.Itoa(len(data)))
			w.Write(data)
		}
	}
}
