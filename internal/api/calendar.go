package api

import (
	"cpkkuview/internal/base"
	"cpkkuview/internal/calendar"
	"cpkkuview/internal/database"
	"cpkkuview/internal/seater"
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func HandleGetCalendarFeed(db database.Database, w http.ResponseWriter, r *http.Request) {
	id := seater.NormalizeID(chi.URLParam(r, "id"))
	if id == "" {
		WriteError(w, "Student ID is required", http.StatusBadRequest)
		return
	}

	icsBytes, ok := calendar.CalendarCache.GetIfPresent(id)
	if !ok {
		seats, err := db.GetSeatsByID(r.Context(), base.SeatsOptions{StudentID: id})
		if err != nil {
			log.Printf("Error querying exams for calendar: %v", err)
			WriteError(w, "Error generating calendar feed", http.StatusInternalServerError)
			return
		}

		icsBytes, err = calendar.Generate(seats)
		if err != nil {
			log.Printf("Error generating calendar: %v", err)
			WriteError(w, "Error generating calendar feed", http.StatusInternalServerError)
			return
		}

		calendar.CalendarCache.Set(id, icsBytes)
	}

	w.Header().Set("Content-Type", "text/calendar; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="exams-%s.ics"`, id))
	w.Header().Set("Cache-Control", "public, max-age=600")
	w.Write(icsBytes)
}
