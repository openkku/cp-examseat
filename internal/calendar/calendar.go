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
		cleanTime := func(tStr string) string {
			tStr = strings.TrimSpace(tStr)
			tStr = strings.ReplaceAll(tStr, ":", ".")
			return tStr
		}

		var startStr, endStr string
		parts := strings.Split(s.Time, "-")
		if len(parts) == 2 {
			startStr = cleanTime(parts[0])
			endStr = cleanTime(parts[1])
		} else {
			startStr = cleanTime(s.Time)
		}

		startTime, err := time.ParseInLocation("2006-01-02 15.04", s.Date+" "+startStr, bangkokLoc)
		if err != nil {
			log.Printf("Error parsing start time: %v", err)
			continue
		}

		// Create Event UID
		uid := fmt.Sprintf("exam-%s-%s-%s-%s-%s@cpkku-view", s.ExamRound, s.StudentID, s.Subject, strings.Join(s.Labels, "_"), s.CustomID)

		summary := fmt.Sprintf("[%s] %s", s.Subject, s.SubjectName)
		if len(s.Labels) > 0 {
			summary += fmt.Sprintf(" (%s)", strings.Join(s.Labels, ", "))
		}

		description := fmt.Sprintf("วิชา: %s - %s\nกลุ่มเรียน (SEC): %s\nห้องสอบ: %s\nที่นั่งสอบ: %s", s.Subject, s.SubjectName, s.Section, s.Room, s.Seat)
		if len(s.Labels) > 0 {
			description += fmt.Sprintf("\nประเภท/ข้อความกำกับ: %s", strings.Join(s.Labels, ", "))
		}
		if s.Note != "" {
			description += fmt.Sprintf("\nหมายเหตุ: %s", s.Note)
		}

		eventOpts := []ikalendar.EventOption{
			ikalendar.WithSummary(summary),
			ikalendar.WithDescription(description),
			ikalendar.WithLocation(s.Room),
			ikalendar.WithDtStart(startTime),
			ikalendar.WithDtStamp(now),
		}

		if endStr != "" {
			endTime, err := time.ParseInLocation("2006-01-02 15.04", s.Date+" "+endStr, bangkokLoc)
			if err != nil {
				log.Printf("Error parsing end time: %v", err)
			} else {
				eventOpts = append(eventOpts, ikalendar.WithDtEnd(endTime))
			}
		}

		event, err := ikalendar.NewEvent(uid, eventOpts...)
		if err != nil {
			log.Printf("Error building event: %v", err)
			continue
		}

		calOpts = append(calOpts, ikalendar.WithEvent(event))
	}

	// Create calendar
	calName := "CP KKU Exam Seats"
	if len(seats) > 0 && seats[0].StudentID != "" {
		calName = fmt.Sprintf("CP KKU Exam Seats (%s)", seats[0].StudentID)
	}
	calOpts = append(calOpts, ikalendar.WithName(calName), ikalendar.WithXWRCalName(calName))
	calOpts = append(calOpts, ikalendar.WithRefreshInterval(ikalendar.DURATION{Hours: 12}))

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
