package main

import (
	"context"
	"cpkkuview/frontend"
	"cpkkuview/internal/api"
	"cpkkuview/internal/config"
	"cpkkuview/internal/database/sqlite"
	"cpkkuview/internal/room"
	"cpkkuview/internal/round"
	"cpkkuview/internal/seater"
	"cpkkuview/internal/stats"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"cpkkuview/internal/compress"
)

func main() {
	var err error
	// Open the database
	dbPath := filepath.Join(config.GetDataDir(), "exams.db")
	db, err := sqlite.New(dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	roundMap := make(map[string]string)
	rounds, err := db.GetRounds(context.Background())
	if err == nil {
		for _, r := range rounds {
			roundMap[r.ID] = r.Label
		}
	} else {
		log.Println("⚠️ Warning: Could not fetch round_info for labels:", err)
	}

	// 2. FETCH ALL EXAMS
	log.Println("📊 Loading data for analytics...")
	allSeats, err := db.GetAllSeats(context.Background())
	if err != nil {
		log.Printf("⚠️ Warning: Could not generate stats: %v", err)
	} else {
		allExams := make([]seater.ExamSchedule, len(allSeats))
		for i, s := range allSeats {
			allExams[i] = seater.ExamSchedule{
				Sheet:       s.ExamRound,
				Date:        s.Date,
				Time:        s.Time,
				Room:        s.Room,
				Subject:     s.Subject,
				SubjectName: s.SubjectName,
				StudentID:   s.StudentID,
			}
		}
		// 3. GENERATE STATS (Pass the labels map)
		stats.GenerateDashboardStats(allExams, roundMap)
	}

	log.Println("🗺️  Pre-loading room layouts...")
	room.Init(filepath.Join(config.GetDataDir(), "room"))

	log.Println("🗺️  Pre-loading Rounds...")
	round.Init(db)

	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(compress.CompressMiddleware)

	// ---------------------------------------------------------
	// API 0: Get Available Rounds (UPDATED)
	// Returns a list of objects {id: "2025_mid", label: "Midterm Exam 2025"}
	// ---------------------------------------------------------
	r.Get("/api/rounds", api.HandleGetRound)

	// ---------------------------------------------------------
	// API 1: Find Exams by Student ID & Round
	// ---------------------------------------------------------
	r.Get("/api/exam", func(w http.ResponseWriter, req *http.Request) {
		api.HandleGetExam(db, w, req)
	})

	// ---------------------------------------------------------
	// API 1.5: Get Calendar Subscription Feed (iCalendar .ics)
	// ---------------------------------------------------------
	r.Get("/api/calendar/{id}", func(w http.ResponseWriter, req *http.Request) {
		api.HandleGetCalendarFeed(db, w, req)
	})

	// ---------------------------------------------------------
	// API 2: Find Exams by Room (Room Explorer)
	// ---------------------------------------------------------
	r.Get("/api/explore", func(w http.ResponseWriter, req *http.Request) {
		api.HandleGetExplore(db, w, req)
	})

	// ---------------------------------------------------------
	// API 3: Get Dropdown Options (Dates/Times/Rooms)
	// ---------------------------------------------------------
	r.Get("/api/options", func(w http.ResponseWriter, req *http.Request) {
		api.HandleGetOptions(db, w, req)
	})

	r.Get("/api/stats", func(w http.ResponseWriter, req *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if stats.CachedStats == nil {
			http.Error(w, `{"error": "Stats not ready"}`, http.StatusServiceUnavailable)
			return
		}
		json.NewEncoder(w).Encode(stats.CachedStats)
	})

	r.Get("/api/room", api.HandleGetRoom)

	r.Get("/room/image/*", func(w http.ResponseWriter, req *http.Request) {
		imageName := chi.URLParam(req, "*")
		localPath := filepath.Join(config.GetDataDir(), "room", "image", imageName)
		if _, err := os.Stat(localPath); err == nil {
			http.ServeFile(w, req, localPath)
			return
		}
		http.Error(w, "Image not found", http.StatusNotFound)
	})

	distFS, err := fs.Sub(frontend.Dist, "dist")
	if err != nil {
		log.Fatal("failed to get dist subdirectory:", err)
	}

	// SPA Handler
	r.Get("/*", serveSPA(distFS))
	srv := &http.Server{
		Addr:    ":8080",
		Handler: r,
	}

	// Create channel to listen for interrupt/termination signals
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		fmt.Println("🔥 Server running on http://localhost:8080")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server ListenAndServe error: %v", err)
		}
	}()

	// Block until a signal is received
	sig := <-stop
	log.Printf("Received signal: %v. Shutting down gracefully...", sig)

	// Context with timeout to allow active requests to finish
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server shutdown forced: %v", err)
	} else {
		log.Println("Server exited cleanly")
	}
}
