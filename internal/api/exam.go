package api

import (
	"cpkkuview/internal/base"
	"cpkkuview/internal/database"
	"cpkkuview/internal/seater"
	"encoding/json"
	"net/http"
)

func HandleGetExam(d database.Database, w http.ResponseWriter, r *http.Request) {
	id := seater.NormalizeID(r.URL.Query().Get("id"))
	round := r.URL.Query().Get("round")

	if id == "" || round == "" {
		WriteError(w, "Student ID and Round are required", http.StatusBadRequest)
		return
	}

	opts := base.SeatsOptions{
		StudentID: id,
		Round:     &round,
	}
	seats, err := d.GetSeatsByID(r.Context(), opts)
	if err != nil {
		WriteError(w, "Database Error", http.StatusInternalServerError)
		return
	}

	if len(seats) == 0 {
		WriteNoData(w, "No exam schedules found")
		return
	}

	exams := []seater.ExamSchedule{}
	for _, s := range seats {
		exams = append(exams, seater.ExamSchedule{
			Sheet:       s.Sheet,
			Date:        s.Date,
			Time:        s.Time,
			Room:        s.Room,
			Subject:     s.Subject,
			SubjectName: s.SubjectName,
			Section:     s.Section,
			StudentID:   s.StudentID,
			Seat:        s.Seat,
			Note:        s.Note,
			Branch:      s.Branch,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(exams)
}
