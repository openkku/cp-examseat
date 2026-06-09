package sqlite

import (
	"context"
	"cpkkuview/internal/base"
	"errors"
)

func (d *Database) GetOptions(ctx context.Context, opts base.ModeOptions) ([]string, error) {
	var query string
	var args []interface{}

	switch opts.Mode {
	case "dates":
		query = "SELECT DISTINCT date FROM exams WHERE exam_round = ? ORDER BY date"
		args = append(args, opts.Round)
	case "times":
		query = "SELECT DISTINCT time FROM exams WHERE exam_round = ? AND date = ? ORDER BY time"
		args = append(args, opts.Round, opts.Date)
	case "rooms":
		query = "SELECT DISTINCT room FROM exams WHERE exam_round = ? AND date = ? AND time = ? ORDER BY room"
		args = append(args, opts.Round, opts.Date, opts.Time)
	default:
		return nil, errors.New("invalid mode")
	}

	rows, err := d.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []string
	for rows.Next() {
		var value string
		if err := rows.Scan(&value); err != nil {
			return nil, err
		}
		result = append(result, value)
	}

	return result, nil
}
