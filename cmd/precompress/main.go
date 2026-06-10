package main

import (
	"bytes"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"github.com/andybalholm/brotli"
	"github.com/klauspost/compress/gzip"
	"github.com/klauspost/compress/zstd"
)

func main() {
	distDir := "frontend/dist"
	if len(os.Args) > 1 {
		distDir = os.Args[1]
	}

	fmt.Printf("Starting pre-compression of static assets in: %s\n", distDir)

	compressibleExts := map[string]bool{
		".html": true,
		".css":  true,
		".js":   true,
		".mjs":  true,
		".json": true,
		".svg":  true,
		".map":  true,
		".txt":  true,
		".xml":  true,
	}

	err := filepath.WalkDir(distDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}

		ext := strings.ToLower(filepath.Ext(path))
		if !compressibleExts[ext] {
			return nil
		}

		// Avoid compressing already compressed files
		if strings.HasSuffix(path, ".gz") || strings.HasSuffix(path, ".br") || strings.HasSuffix(path, ".zst") {
			return nil
		}

		fmt.Printf("Compressing: %s\n", path)
		data, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("failed to read file %s: %w", path, err)
		}

		// 1. Gzip
		var gzipBuf bytes.Buffer
		gw, err := gzip.NewWriterLevel(&gzipBuf, gzip.BestCompression)
		if err != nil {
			return fmt.Errorf("failed to create gzip writer: %w", err)
		}
		if _, err := gw.Write(data); err != nil {
			gw.Close()
			return fmt.Errorf("failed to write gzip: %w", err)
		}
		if err := gw.Close(); err != nil {
			return fmt.Errorf("failed to close gzip writer: %w", err)
		}
		if err := os.WriteFile(path+".gz", gzipBuf.Bytes(), 0644); err != nil {
			return fmt.Errorf("failed to write .gz file: %w", err)
		}

		// 2. Brotli
		var brBuf bytes.Buffer
		bw := brotli.NewWriterLevel(&brBuf, 11) // Max quality/compression
		if _, err := bw.Write(data); err != nil {
			bw.Close()
			return fmt.Errorf("failed to write brotli: %w", err)
		}
		if err := bw.Close(); err != nil {
			return fmt.Errorf("failed to close brotli writer: %w", err)
		}
		if err := os.WriteFile(path+".br", brBuf.Bytes(), 0644); err != nil {
			return fmt.Errorf("failed to write .br file: %w", err)
		}

		// 3. Zstd
		var zstdBuf bytes.Buffer
		zw, err := zstd.NewWriter(&zstdBuf, zstd.WithEncoderLevel(zstd.SpeedBestCompression))
		if err != nil {
			return fmt.Errorf("failed to create zstd writer: %w", err)
		}
		if _, err := zw.Write(data); err != nil {
			zw.Close()
			return fmt.Errorf("failed to write zstd: %w", err)
		}
		if err := zw.Close(); err != nil {
			return fmt.Errorf("failed to close zstd writer: %w", err)
		}
		if err := os.WriteFile(path+".zst", zstdBuf.Bytes(), 0644); err != nil {
			return fmt.Errorf("failed to write .zst file: %w", err)
		}

		return nil
	})

	if err != nil {
		fmt.Printf("Error walking/compressing directory: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Pre-compression completed successfully!")
}
