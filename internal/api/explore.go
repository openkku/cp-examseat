package api

import (
	"cpkkuview/internal/base"
	"cpkkuview/internal/compress"
	"cpkkuview/internal/database"
	"cpkkuview/internal/explore"
	"cpkkuview/internal/seater"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

func HandleGetExplore(d database.Database, w http.ResponseWriter, r *http.Request) {
	round := r.URL.Query().Get("round")
	room := r.URL.Query().Get("room")
	date := r.URL.Query().Get("date")
	timeParam := r.URL.Query().Get("time") // Renamed to avoid shadowing 'time' package
	seat := r.URL.Query().Get("seat")

	if round == "" || room == "" || timeParam == "" || date == "" {
		WriteError(w, "Round, Room, Date, and Time parameters are required", http.StatusBadRequest)
		return
	}

	encoding := compress.GetEncoding(r)

	// 2. Generate the unique cache key for this exact search including the encoding
	cacheKey := fmt.Sprintf("explore:%s:%s:%s:%s:%s:%s", round, room, date, timeParam, seat, encoding)

	// 3. Fetch from Cache
	cachedBytes, ok := explore.ExploreCache.GetIfPresent(cacheKey)
	if !ok {
		var seatPtr *string
		if seat != "" {
			seatPtr = &seat
		}

		seats, err := d.GetSeats(r.Context(), base.ExploreOptions{
			Round: round,
			Room:  room,
			Date:  date,
			Time:  timeParam,
			Seat:  seatPtr,
		})

		if err != nil {
			WriteError(w, "Database Error", http.StatusInternalServerError)
			return
		}

		if len(seats) == 0 {
			payload := []byte(`{"error":"no exams found"}`)
			compressedBytes, err := compress.CompressBytes(payload, encoding)
			if err != nil {
				WriteError(w, "Internal Server Error", http.StatusInternalServerError)
				return
			}
			cachedBytes = append([]byte{1}, compressedBytes...)
			explore.ExploreCache.Set(cacheKey, cachedBytes)
		} else {
			results := []seater.ExamSchedule{}
			for _, s := range seats {
				results = append(results, seater.ExamSchedule{
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
				})
			}

			// 4. Marshal to JSON once
			jsonBytes, err := json.Marshal(results)
			if err != nil {
				log.Printf("JSON Marshal Error: %v", err)
				WriteError(w, "Internal Server Error", http.StatusInternalServerError)
				return
			}

			// 5. Compress the bytes once
			compressedBytes, err := compress.CompressBytes(jsonBytes, encoding)
			if err != nil {
				WriteError(w, "Internal Server Error", http.StatusInternalServerError)
				return
			}

			cachedBytes = append([]byte{0}, compressedBytes...)
			explore.ExploreCache.Set(cacheKey, cachedBytes)
		}
	}

	// 6. Serve to the client
	w.Header().Set("Content-Type", "application/json")
	if len(cachedBytes) > 0 {
		statusIndicator := cachedBytes[0]
		if statusIndicator == 1 {
			w.WriteHeader(http.StatusNotFound)
		}
		if encoding != "" {
			w.Header().Set("Content-Encoding", encoding)
		}
		w.Write(cachedBytes[1:])
	}
}

func HandleGetOptions(d database.Database, w http.ResponseWriter, r *http.Request) {
	mode := r.URL.Query().Get("type") // "dates", "times", or "rooms"
	round := r.URL.Query().Get("round")

	date := r.URL.Query().Get("date")
	time := r.URL.Query().Get("time")

	if round == "" {
		WriteError(w, "Round parameter is required", http.StatusBadRequest)
		return
	}

	options, err := d.GetOptions(r.Context(), base.ModeOptions{
		Mode:  mode,
		Round: round,
		Date:  date,
		Time:  time,
	})
	if err != nil {
		WriteError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(options)
}
