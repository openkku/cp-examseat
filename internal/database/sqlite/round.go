package sqlite

import (
	"context"
	"cpkkuview/internal/database"
	"cpkkuview/internal/seater"
	"fmt"
	"sort"
	"strings"
)

func (d *Database) PurgeRound(ctx context.Context, roundID string) error {
	tx, err := d.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, "DELETE FROM exam_sessions WHERE exam_round = ? AND category = 'IN_SCHEDULE'", roundID); err != nil {
		return fmt.Errorf("failed to clear existing in-schedule sessions: %w", err)
	}
	if _, err := tx.ExecContext(ctx, "DELETE FROM subjects WHERE exam_round = ?", roundID); err != nil {
		return fmt.Errorf("failed to clear existing subjects: %w", err)
	}

	var count int
	if err := tx.QueryRowContext(ctx, "SELECT COUNT(*) FROM exam_sessions WHERE exam_round = ?", roundID).Scan(&count); err == nil && count == 0 {
		if _, err := tx.ExecContext(ctx, "DELETE FROM round_info WHERE id = ?", roundID); err != nil {
			return fmt.Errorf("failed to clear round metadata: %w", err)
		}
	}
	err = tx.Commit()
	if err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	return nil
}

func (d *Database) PurgeCustomDataset(ctx context.Context, roundID string, customID string) error {
	if customID == "" {
		return d.PurgeRound(ctx, roundID)
	}

	tx, err := d.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, "DELETE FROM exam_sessions WHERE exam_round = ? AND custom_id = ?", roundID, customID); err != nil {
		return fmt.Errorf("failed to clear custom dataset sessions: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	return nil
}

func (d *Database) AddRound(ctx context.Context, roundID string, displayName string, seats []database.Seats) error {
	tx, err := d.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Save round metadata
	if _, err := tx.ExecContext(ctx, "INSERT INTO round_info (id, label) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET label = excluded.label", roundID, displayName); err != nil {
		return fmt.Errorf("failed to save round metadata: %w", err)
	}

	stmtSession, err := tx.PrepareContext(ctx, `
		INSERT INTO exam_sessions (exam_round, category, custom_id, sheet, date, time_start, time_end, room, subject_id, section, note, room_layout)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return fmt.Errorf("failed to prepare insert session statement: %w", err)
	}
	defer stmtSession.Close()

	stmtLabel, err := tx.PrepareContext(ctx, `
		INSERT OR IGNORE INTO session_labels (session_id, label) VALUES (?, ?)
	`)
	if err != nil {
		return fmt.Errorf("failed to prepare insert label statement: %w", err)
	}
	defer stmtLabel.Close()

	stmtStudent, err := tx.PrepareContext(ctx, `
		INSERT OR IGNORE INTO students (id, branch) VALUES (?, ?)
	`)
	if err != nil {
		return fmt.Errorf("failed to prepare insert student statement: %w", err)
	}
	defer stmtStudent.Close()

	stmtSeat, err := tx.PrepareContext(ctx, `
		INSERT INTO exam_seats (session_id, student_id, seat) VALUES (?, ?, ?)
	`)
	if err != nil {
		return fmt.Errorf("failed to prepare insert seat statement: %w", err)
	}
	defer stmtSeat.Close()

	stmtSubject, err := tx.PrepareContext(ctx, `
		INSERT INTO subjects (id, exam_round, name) VALUES (?, ?, ?) ON CONFLICT(id, exam_round) DO UPDATE SET name = excluded.name
	`)
	if err != nil {
		return fmt.Errorf("failed to prepare insert subject statement: %w", err)
	}
	defer stmtSubject.Close()

	savedSubjects := make(map[string]bool)
	sessionMap := make(map[string]int64)

	for _, s := range seats {
		category := s.Category
		if category == "" {
			if s.CustomID != "" || hasLabel(s.Labels, "นัดสอบนอกตาราง") {
				category = "OUT_OF_SCHEDULE"
			} else {
				category = "IN_SCHEDULE"
			}
		}

		dateVal := s.Date
		timeStart := s.TimeStart
		timeEnd := s.TimeEnd
		if timeStart == "" && s.Time != "" {
			parts := strings.Split(s.Time, "-")
			if len(parts) == 2 {
				timeStart = strings.TrimSpace(parts[0])
				timeEnd = strings.TrimSpace(parts[1])
			} else {
				timeStart = strings.TrimSpace(s.Time)
			}
		}

		sessionKey := fmt.Sprintf("%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s",
			roundID, category, s.CustomID, s.Sheet, dateVal, timeStart, timeEnd, s.Room, s.Subject, s.Section, s.Note, s.RoomLayout)

		sessionID, exists := sessionMap[sessionKey]
		if !exists {
			res, err := stmtSession.ExecContext(ctx, roundID, category, s.CustomID, s.Sheet, dateVal, timeStart, timeEnd, s.Room, s.Subject, s.Section, s.Note, s.RoomLayout)
			if err != nil {
				return fmt.Errorf("failed to insert exam session: %w", err)
			}
			sessionID, err = res.LastInsertId()
			if err != nil {
				return fmt.Errorf("failed to get last insert id for session: %w", err)
			}
			sessionMap[sessionKey] = sessionID

			for _, lbl := range s.Labels {
				lbl = strings.TrimSpace(lbl)
				if lbl != "" {
					if _, err := stmtLabel.ExecContext(ctx, sessionID, lbl); err != nil {
						return fmt.Errorf("failed to insert label: %w", err)
					}
				}
			}
		}

		if s.StudentID != "" {
			if _, err := stmtStudent.ExecContext(ctx, s.StudentID, s.Branch); err != nil {
				return fmt.Errorf("failed to insert student: %w", err)
			}
			if _, err := stmtSeat.ExecContext(ctx, sessionID, s.StudentID, s.Seat); err != nil {
				return fmt.Errorf("failed to insert exam seat: %w", err)
			}
		}

		if s.Subject != "" && !savedSubjects[s.Subject] {
			if _, err := stmtSubject.ExecContext(ctx, s.Subject, roundID, s.SubjectName); err != nil {
				return fmt.Errorf("failed to insert subject: %w", err)
			}
			savedSubjects[s.Subject] = true
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	return nil
}

func hasLabel(labels []string, target string) bool {
	for _, l := range labels {
		if strings.EqualFold(l, target) {
			return true
		}
	}
	return false
}

func (d *Database) GetRounds(ctx context.Context) ([]database.RoundOption, error) {
	query := `
		SELECT id, label 
		FROM round_info 
		ORDER BY rowid DESC
	`
	rows, err := d.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query rounds: %w", err)
	}
	defer rows.Close()

	var rounds []database.RoundOption
	for rows.Next() {
		var ro database.RoundOption
		if err := rows.Scan(&ro.ID, &ro.Label); err != nil {
			return nil, fmt.Errorf("failed to scan round: %w", err)
		}
		rounds = append(rounds, ro)
	}

	sort.Slice(rounds, func(i, j int) bool {
		return seater.CompareRounds(rounds[i].ID, rounds[j].ID)
	})

	return rounds, nil
}

func (d *Database) GetAllSeats(ctx context.Context) ([]database.Seats, error) {
	query := `
		SELECT 
			es.sheet, es.date, es.time_start, COALESCE(es.time_end, ''), es.room, es.subject_id, es.section, st_seat.student_id, st_seat.seat, es.note,
			COALESCE(sub.name, '') as subject_name, es.exam_round, COALESCE(st.branch, '') as branch,
			COALESCE((SELECT GROUP_CONCAT(label, ',') FROM session_labels WHERE session_id = es.id), '') as labels,
			COALESCE(es.room_layout, '') as room_layout, COALESCE(es.custom_id, '') as custom_id, COALESCE(es.category, '') as category
		FROM exam_seats st_seat
		JOIN exam_sessions es ON st_seat.session_id = es.id
		JOIN students st ON st_seat.student_id = st.id
		LEFT JOIN subjects sub ON es.subject_id = sub.id AND es.exam_round = sub.exam_round
	`
	rows, err := d.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query all seats: %w", err)
	}
	defer rows.Close()

	var seats []database.Seats
	for rows.Next() {
		var s database.Seats
		var rawLabels string
		err := rows.Scan(
			&s.Sheet,
			&s.Date,
			&s.TimeStart,
			&s.TimeEnd,
			&s.Room,
			&s.Subject,
			&s.Section,
			&s.StudentID,
			&s.Seat,
			&s.Note,
			&s.SubjectName,
			&s.ExamRound,
			&s.Branch,
			&rawLabels,
			&s.RoomLayout,
			&s.CustomID,
			&s.Category,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan seat: %w", err)
		}
		s.Time = s.GetTime()
		s.Labels = seater.ParseLabels(rawLabels)
		seats = append(seats, s)
	}
	return seats, nil
}
