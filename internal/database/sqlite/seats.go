package sqlite

import (
	"context"
	"cpkkuview/internal/base"
	"cpkkuview/internal/database"
	"fmt"
)

func (d *Database) GetSeatsByID(ctx context.Context, opts base.SeatsOptions) ([]database.Seats, error) {
	query := `
        SELECT 
            e.sheet, e.date, e.time, e.room, e.subject, e.section, e.student_id, e.seat, e.note,
            COALESCE(s.name, '') as subject_name,
            e.exam_round,
            COALESCE(e.branch, '') as branch
        FROM exams e
        LEFT JOIN subjects s 
            ON e.subject = s.id 
            AND e.exam_round = s.exam_round
        WHERE e.student_id = ?
    `

	args := []any{opts.StudentID}

	if opts.Round != nil {
		query += " AND e.exam_round = ?"
		args = append(args, *opts.Round)
	}

	if opts.Sheet != nil {
		query += " AND e.sheet = ?"
		args = append(args, *opts.Sheet)
	}

	query += " ORDER BY e.date ASC, e.time ASC"

	rows, err := d.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("error querying seats: %w", err)
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
			return nil, fmt.Errorf("error scanning seats: %w", err)
		}
		seats = append(seats, s)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over seats rows: %w", err)
	}

	return seats, nil
}

func (d *Database) GetSeats(ctx context.Context, opts base.ExploreOptions) ([]database.Seats, error) {
	query := `
            SELECT 
                e.sheet, e.date, e.time, e.room, e.subject, e.section, e.student_id, e.seat, e.note,
                COALESCE(s.name, '') as subject_name,
                e.exam_round,
                COALESCE(e.branch, '') as branch
            FROM exams e
            LEFT JOIN subjects s 
                ON e.subject = s.id 
                AND e.exam_round = s.exam_round
            WHERE e.exam_round = ? AND e.room = ? AND e.date = ? AND e.time = ?
        `
	args := []any{opts.Round, opts.Room, opts.Date, opts.Time}

	if opts.Seat != nil && *opts.Seat != "" {
		query += " AND e.seat = ?"
		args = append(args, *opts.Seat)
	}

	query += " ORDER BY e.seat ASC"

	rows, err := d.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("error querying seats: %w", err)
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
			return nil, fmt.Errorf("error scanning seats: %w", err)
		}
		seats = append(seats, s)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over seats rows: %w", err)
	}

	return seats, nil
}
