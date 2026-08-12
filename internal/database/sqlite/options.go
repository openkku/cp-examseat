package sqlite

import (
	"context"
	"cpkkuview/internal/base"
	"cpkkuview/internal/room"
	"errors"
)

func (d *Database) GetOptions(ctx context.Context, opts base.ModeOptions) ([]string, error) {
	hasRoomFilter := len(room.RoomCache) > 0

	switch opts.Mode {
	case "dates":
		query := "SELECT DISTINCT date, room FROM exams WHERE exam_round = ? ORDER BY date"
		rows, err := d.db.QueryContext(ctx, query, opts.Round)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		dateSet := make(map[string]bool)
		var result []string
		for rows.Next() {
			var dateVal, roomVal string
			if err := rows.Scan(&dateVal, &roomVal); err != nil {
				return nil, err
			}
			if hasRoomFilter {
				if _, exists := room.RoomCache[roomVal]; !exists {
					continue
				}
			}
			if !dateSet[dateVal] {
				dateSet[dateVal] = true
				result = append(result, dateVal)
			}
		}
		return result, nil

	case "times":
		query := "SELECT DISTINCT time, room FROM exams WHERE exam_round = ? AND date = ? ORDER BY time"
		rows, err := d.db.QueryContext(ctx, query, opts.Round, opts.Date)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		timeSet := make(map[string]bool)
		var result []string
		for rows.Next() {
			var timeVal, roomVal string
			if err := rows.Scan(&timeVal, &roomVal); err != nil {
				return nil, err
			}
			if hasRoomFilter {
				if _, exists := room.RoomCache[roomVal]; !exists {
					continue
				}
			}
			if !timeSet[timeVal] {
				timeSet[timeVal] = true
				result = append(result, timeVal)
			}
		}
		return result, nil

	case "rooms":
		query := "SELECT DISTINCT room FROM exams WHERE exam_round = ? AND date = ? AND time = ? ORDER BY room"
		rows, err := d.db.QueryContext(ctx, query, opts.Round, opts.Date, opts.Time)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		var result []string
		for rows.Next() {
			var roomVal string
			if err := rows.Scan(&roomVal); err != nil {
				return nil, err
			}
			if hasRoomFilter {
				if _, exists := room.RoomCache[roomVal]; !exists {
					continue
				}
			}
			result = append(result, roomVal)
		}
		return result, nil

	default:
		return nil, errors.New("invalid mode")
	}
}
