package calendar

import (
	"fmt"
	"log"
	"strings"
	"time"

	"cpkkuview/internal/base"

	ikalendar "github.com/minoplhy/ikalendar/pkg"
)

// Generate builds the calendar ICS bytes for the given slice of seats.
func Generate(seats []base.Seats) ([]byte, error) {
	bangkokLoc := time.FixedZone("Asia/Bangkok", 7*60*60)
	now := time.Now()

	var calOpts []ikalendar.CalendarOption

	for _, s := range seats {
		// Parse times (format e.g., "09.00 - 12.00")
		parts := strings.Split(s.Time, "-")
		if len(parts) != 2 {
			log.Printf("Invalid time range format: %s for subject %s", s.Time, s.Subject)
			continue
		}

		cleanTime := func(tStr string) string {
			tStr = strings.TrimSpace(tStr)
			tStr = strings.ReplaceAll(tStr, ":", ".")
			return tStr
		}

		startStr := cleanTime(parts[0])
		endStr := cleanTime(parts[1])

		startTime, err := time.ParseInLocation("2006-01-02 15.04", s.Date+" "+startStr, bangkokLoc)
		if err != nil {
			log.Printf("Error parsing start time: %v", err)
			continue
		}

		endTime, err := time.ParseInLocation("2006-01-02 15.04", s.Date+" "+endStr, bangkokLoc)
		if err != nil {
			log.Printf("Error parsing end time: %v", err)
			continue
		}

		// Create Event UID
		uid := fmt.Sprintf("exam-%s-%s-%s@cpkku-view", s.ExamRound, s.StudentID, s.Subject)

		summary := fmt.Sprintf("[%s] %s", s.Subject, s.SubjectName)
		description := fmt.Sprintf("วิชา: %s - %s\nกลุ่มเรียน (SEC): %s\nห้องสอบ: %s\nที่นั่งสอบ: %s", s.Subject, s.SubjectName, s.Section, s.Room, s.Seat)
		if s.Note != "" {
			description += fmt.Sprintf("\nหมายเหตุ: %s", s.Note)
		}

		event, err := ikalendar.NewEvent(uid,
			ikalendar.WithSummary(summary),
			ikalendar.WithDescription(description),
			ikalendar.WithLocation(s.Room),
			ikalendar.WithDtStart(startTime),
			ikalendar.WithDtEnd(endTime),
			ikalendar.WithDtStamp(now),
		)
		if err != nil {
			log.Printf("Error building event: %v", err)
			continue
		}

		calOpts = append(calOpts, ikalendar.WithEvent(event))
	}

	// Create calendar
	cal, err := ikalendar.NewCalendar(calOpts...)
	if err != nil {
		return nil, fmt.Errorf("error creating calendar: %w", err)
	}

	icsBytes, err := ikalendar.Marshal(cal)
	if err != nil {
		return nil, fmt.Errorf("error marshaling calendar: %w", err)
	}

	return icsBytes, nil
}
