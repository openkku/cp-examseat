package sqlite

import (
	"context"
	"cpkkuview/internal/base"
	"cpkkuview/internal/database"
	"cpkkuview/internal/seater"
	"fmt"
)

func (d *Database) GetSeatsByID(ctx context.Context, opts base.SeatsOptions) ([]database.Seats, error) {
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
        WHERE st_seat.student_id = ?
    `

	args := []any{opts.StudentID}

	if opts.Round != nil {
		query += " AND es.exam_round = ?"
		args = append(args, *opts.Round)
	}

	if opts.Sheet != nil {
		query += " AND es.sheet = ?"
		args = append(args, *opts.Sheet)
	}

	query += " ORDER BY es.date ASC, es.time_start ASC"

	rows, err := d.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("error querying seats: %w", err)
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
			return nil, fmt.Errorf("error scanning seats: %w", err)
		}
		s.Time = s.GetTime()
		s.Labels = seater.ParseLabels(rawLabels)
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
            es.sheet, es.date, es.time_start, COALESCE(es.time_end, ''), es.room, es.subject_id, es.section, st_seat.student_id, st_seat.seat, es.note,
            COALESCE(sub.name, '') as subject_name, es.exam_round, COALESCE(st.branch, '') as branch,
            COALESCE((SELECT GROUP_CONCAT(label, ',') FROM session_labels WHERE session_id = es.id), '') as labels,
            COALESCE(es.room_layout, '') as room_layout, COALESCE(es.custom_id, '') as custom_id, COALESCE(es.category, '') as category
        FROM exam_seats st_seat
        JOIN exam_sessions es ON st_seat.session_id = es.id
        JOIN students st ON st_seat.student_id = st.id
        LEFT JOIN subjects sub ON es.subject_id = sub.id AND es.exam_round = sub.exam_round
        WHERE es.exam_round = ? AND es.room = ? AND (es.date = ? OR ? = '')
    `
	args := []any{opts.Round, opts.Room, opts.Date, opts.Date}

	if opts.Time != "" {
		query += " AND (es.time_start = ? OR (es.time_start || '-' || COALESCE(es.time_end, '')) = ?)"
		args = append(args, opts.Time, opts.Time)
	}

	if opts.Seat != nil && *opts.Seat != "" {
		query += " AND st_seat.seat = ?"
		args = append(args, *opts.Seat)
	}

	query += " ORDER BY st_seat.seat ASC"

	rows, err := d.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("error querying seats: %w", err)
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
			return nil, fmt.Errorf("error scanning seats: %w", err)
		}
		s.Time = s.GetTime()
		s.Labels = seater.ParseLabels(rawLabels)
		seats = append(seats, s)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over seats rows: %w", err)
	}

	return seats, nil
}
