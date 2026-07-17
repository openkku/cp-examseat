package sqlite

import (
	"context"
	"cpkkuview/internal/database"
	"cpkkuview/internal/seater"
	"fmt"
	"sort"
)

func (d *Database) PurgeRound(ctx context.Context, roundID string) error {
	tx, err := d.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, "DELETE FROM exams WHERE exam_round = ?", roundID); err != nil {
		return fmt.Errorf("failed to clear existing exams: %w", err)
	}
	if _, err := tx.ExecContext(ctx, "DELETE FROM subjects WHERE exam_round = ?", roundID); err != nil {
		return fmt.Errorf("failed to clear existing subjects: %w", err)
	}
	if _, err := tx.ExecContext(ctx, "DELETE FROM round_info WHERE id = ?", roundID); err != nil {
		return fmt.Errorf("failed to clear round metadata: %w", err)
	}
	err = tx.Commit()
	if err != nil {
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
	if _, err := tx.ExecContext(ctx, "INSERT OR REPLACE INTO round_info (id, label) VALUES (?, ?)", roundID, displayName); err != nil {
		return fmt.Errorf("failed to save round metadata: %w", err)
	}

	// Prepare statement for exams
	stmtExam, err := tx.PrepareContext(ctx, `
		INSERT OR REPLACE INTO exams (exam_round, student_id, branch, sheet, date, time, room, subject, section, seat, note)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return fmt.Errorf("failed to prepare insert exam statement: %w", err)
	}
	defer stmtExam.Close()

	// Prepare statement for subjects
	stmtSubject, err := tx.PrepareContext(ctx, `
		INSERT OR REPLACE INTO subjects (id, exam_round, name) VALUES (?, ?, ?)
	`)
	if err != nil {
		return fmt.Errorf("failed to prepare insert subject statement: %w", err)
	}
	defer stmtSubject.Close()

	savedSubjects := make(map[string]bool)

	for _, s := range seats {
		_, err := stmtExam.ExecContext(ctx, roundID, s.StudentID, s.Branch, s.Sheet, s.Date, s.Time, s.Room, s.Subject, s.Section, s.Seat, s.Note)
		if err != nil {
			return fmt.Errorf("failed to insert exam (student: %s, subject: %s): %w", s.StudentID, s.Subject, err)
		}

		if s.Subject != "" && !savedSubjects[s.Subject] {
			_, err := stmtSubject.ExecContext(ctx, s.Subject, roundID, s.SubjectName)
			if err != nil {
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
			e.sheet, e.date, e.time, e.room, e.subject, e.section, e.student_id, e.seat, e.note,
			COALESCE(s.name, '') as subject_name,
			e.exam_round,
			COALESCE(e.branch, '') as branch
		FROM exams e
		LEFT JOIN subjects s ON e.subject = s.id AND e.exam_round = s.exam_round
	`
	rows, err := d.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query all seats: %w", err)
	}
	defer rows.Close()

	var seats []database.Seats
	for rows.Next() {
		var s database.Seats
		err := rows.Scan(
			&s.Sheet,
			&s.Date,
			&s.Time,
			&s.Room,
			&s.Subject,
			&s.Section,
			&s.StudentID,
			&s.Seat,
			&s.Note,
			&s.SubjectName,
			&s.ExamRound,
			&s.Branch,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan seat: %w", err)
		}
		seats = append(seats, s)
	}
	return seats, nil
}
