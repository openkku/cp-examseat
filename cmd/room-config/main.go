package main

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

//go:embed all:frontend/dist
var frontendDist embed.FS

type RoomMeta struct {
	LayoutFile  string   `json:"layout_file"`
	LayoutImage string   `json:"layout_image"`
	MapURL      string   `json:"map_url"`
	Images      []string `json:"images"`
}

func main() {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(enableCORS)

	// API Routes
	r.Route("/api", func(r chi.Router) {
		r.Get("/config", handleGetConfig)
		r.Post("/config/{roomId}", handleSaveRoomMeta)
		r.Delete("/config/{roomId}", handleDeleteRoomMeta)
		r.Get("/layout/{filename}", handleGetLayout)
		r.Post("/layout/{filename}", handleSaveLayout)
	})

	// Static files fallback (SPA support)
	serveEmbeddedFrontend(r)

	port := "8081"
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		fmt.Printf("🚀 Room Config Manager running on http://localhost:%s\n", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Room Config Manager ListenAndServe error: %v", err)
		}
	}()

	sig := <-stop
	log.Printf("Received signal: %v. Shutting down Room Config Manager gracefully...", sig)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Room Config Manager shutdown forced: %v", err)
	} else {
		log.Println("Room Config Manager exited cleanly")
	}
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func GetDataDir() string {
	dir := os.Getenv("DATA_DIR")
	if dir == "" {
		return "data"
	}
	return dir
}

// metadataPath returns the absolute or relative path to the metadata.json file
func metadataPath() string {
	dir := filepath.Join(GetDataDir(), "room")
	os.MkdirAll(dir, 0755)
	return filepath.Join(dir, "metadata.json")
}

// mapDir returns the path to the map/ layouts directory
func mapDir() string {
	meta := metadataPath()
	dir := filepath.Join(filepath.Dir(meta), "map")
	os.MkdirAll(dir, 0755)
	return dir
}

func handleGetConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	filePath := metadataPath()

	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			w.Write([]byte("{}"))
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Write(data)
}

func handleSaveRoomMeta(w http.ResponseWriter, r *http.Request) {
	roomId := chi.URLParam(r, "roomId")
	if roomId == "" {
		http.Error(w, "Room ID is required", http.StatusBadRequest)
		return
	}

	var meta RoomMeta
	if err := json.NewDecoder(r.Body).Decode(&meta); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	filePath := metadataPath()

	// Read existing config
	configData := make(map[string]RoomMeta)
	if data, err := os.ReadFile(filePath); err == nil {
		json.Unmarshal(data, &configData)
	}

	// Update metadata entry
	configData[roomId] = meta

	// Ensure layout file exists if named
	if meta.LayoutFile != "" {
		layoutPath := filepath.Join(mapDir(), meta.LayoutFile)
		if _, err := os.Stat(layoutPath); os.IsNotExist(err) {
			// Write basic empty layout
			emptyLayout := []byte(`{"layout": []}`)
			os.WriteFile(layoutPath, emptyLayout, 0644)
		}
	}

	// Save configuration back to disk
	newData, err := json.MarshalIndent(configData, "", "  ")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := os.WriteFile(filePath, newData, 0644); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"success": true}`))
}

func handleDeleteRoomMeta(w http.ResponseWriter, r *http.Request) {
	roomId := chi.URLParam(r, "roomId")
	if roomId == "" {
		http.Error(w, "Room ID is required", http.StatusBadRequest)
		return
	}

	filePath := metadataPath()

	// Read existing config
	configData := make(map[string]RoomMeta)
	data, err := os.ReadFile(filePath)
	if err != nil {
		http.Error(w, "Metadata config file not found", http.StatusNotFound)
		return
	}
	json.Unmarshal(data, &configData)

	meta, exists := configData[roomId]
	if !exists {
		http.Error(w, "Room not found", http.StatusNotFound)
		return
	}

	// Remove key
	delete(configData, roomId)

	// Save back
	newData, err := json.MarshalIndent(configData, "", "  ")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := os.WriteFile(filePath, newData, 0644); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Delete layout file if not used by any other room
	if meta.LayoutFile != "" {
		isUsed := false
		for _, otherMeta := range configData {
			if otherMeta.LayoutFile == meta.LayoutFile {
				isUsed = true
				break
			}
		}
		if !isUsed {
			layoutPath := filepath.Join(mapDir(), meta.LayoutFile)
			os.Remove(layoutPath)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"success": true}`))
}

func handleGetLayout(w http.ResponseWriter, r *http.Request) {
	filename := chi.URLParam(r, "filename")
	if filename == "" {
		http.Error(w, "Filename is required", http.StatusBadRequest)
		return
	}

	// Prevent directory traversal
	filename = filepath.Base(filename)

	layoutPath := filepath.Join(mapDir(), filename)
	data, err := os.ReadFile(layoutPath)
	if err != nil {
		if os.IsNotExist(err) {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"layout": []}`))
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func handleSaveLayout(w http.ResponseWriter, r *http.Request) {
	filename := chi.URLParam(r, "filename")
	if filename == "" {
		http.Error(w, "Filename is required", http.StatusBadRequest)
		return
	}

	// Prevent directory traversal
	filename = filepath.Base(filename)

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Quick validation check
	var testObj map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &testObj); err != nil {
		http.Error(w, "Invalid layout JSON", http.StatusBadRequest)
		return
	}

	layoutPath := filepath.Join(mapDir(), filename)
	if err := os.WriteFile(layoutPath, bodyBytes, 0644); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"success": true}`))
}

func serveEmbeddedFrontend(mux *chi.Mux) {
	mux.Get("/*", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if path == "/" || path == "" {
			path = "index.html"
		}

		path = filepath.Clean(path)
		if strings.HasPrefix(path, "/") {
			path = path[1:]
		}

		embedPath := filepath.Join("frontend/dist", path)
		fileBytes, err := frontendDist.ReadFile(embedPath)
		if err != nil {
			fallbackPath := "frontend/dist/index.html"
			fileBytes, err = frontendDist.ReadFile(fallbackPath)
			if err != nil {
				w.Header().Set("Content-Type", "text/html; charset=utf-8")
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(`
					<!DOCTYPE html>
					<html>
					<head>
						<title>Room Config Manager</title>
						<meta charset="UTF-8">
					</head>
					<body style="font-family: sans-serif; padding: 2rem; background: #0f172a; color: #f8fafc; text-align: center;">
						<h1>Room Config Manager</h1>
						<p>Frontend build assets not found.</p>
						<p>During development, please run the Vite dev server inside <code>cmd/room-config/frontend</code>:</p>
						<pre style="background: #1e293b; padding: 1rem; border-radius: 8px; display: inline-block; text-align: left;">
cd cmd/room-config/frontend
npm run dev</pre>
						<p>For production, build the assets first:</p>
						<pre style="background: #1e293b; padding: 1rem; border-radius: 8px; display: inline-block; text-align: left;">
cd cmd/room-config/frontend
npm run build</pre>
					</body>
					</html>
				`))
				return
			}
		}

		mimeType := mime.TypeByExtension(filepath.Ext(path))
		if mimeType != "" {
			w.Header().Set("Content-Type", mimeType)
		}
		w.Write(fileBytes)
	})
}
