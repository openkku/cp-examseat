package api

import (
	"cpkkuview/internal/base"
	"cpkkuview/internal/calendar"
	"cpkkuview/internal/database"
	"cpkkuview/internal/seater"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
)

func HandleGetCalendarFeed(db database.Database, w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	idParam = strings.TrimSuffix(idParam, ".ics")
	id := seater.NormalizeID(idParam)
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

		if len(seats) == 0 {
			WriteNoData(w, "No exam schedules found for this student")
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
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="exams-%s.ics"`, idParam))
	w.Header().Set("Cache-Control", "public, max-age=600")
	w.Write(icsBytes)
}
