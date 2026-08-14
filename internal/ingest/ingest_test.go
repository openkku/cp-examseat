package ingest

import (
	"os"
	"path/filepath"
	"testing"
)

func TestParseJSONSeats(t *testing.T) {
	tmpDir := t.TempDir()
	jsonFile := filepath.Join(tmpDir, "mock_schedule.json")

	jsonContent := `[
		{
			"sheet": "Sheet1",
			"date": "2026-09-15",
			"time": "09.00 - 12.00",
			"room": "CP9421",
			"subject": "CP422021",
			"subject_name": "Web & Mobile Architecture",
			"section": "1",
			"student_id": "683380001-1",
			"seat": "A01"
		}
	]`

	if err := os.WriteFile(jsonFile, []byte(jsonContent), 0644); err != nil {
		t.Fatalf("Failed to write mock json: %v", err)
	}

	seats, err := parseJSONSeats(jsonFile, "mid_1_2569", []string{"Lecture", "นัดสอบนอกตาราง"}, "CP9421_LAYOUT", "MID_1_2569_CP422021_LEC")
	if err != nil {
		t.Fatalf("parseJSONSeats failed: %v", err)
	}

	if len(seats) != 1 {
		t.Fatalf("Expected 1 seat parsed, got %d", len(seats))
	}

	s := seats[0]
	if s.ExamRound != "mid_1_2569" {
		t.Errorf("Expected round 'mid_1_2569', got %s", s.ExamRound)
	}
	if s.CustomID != "MID_1_2569_CP422021_LEC" {
		t.Errorf("Expected custom_id 'MID_1_2569_CP422021_LEC', got %s", s.CustomID)
	}
	if len(s.Labels) != 2 || s.Labels[0] != "Lecture" || s.Labels[1] != "นัดสอบนอกตาราง" {
		t.Errorf("Expected labels ['Lecture', 'นัดสอบนอกตาราง'], got %v", s.Labels)
	}
	if s.RoomLayout != "CP9421_LAYOUT" {
		t.Errorf("Expected room_layout 'CP9421_LAYOUT', got %s", s.RoomLayout)
	}
	if s.TimeStart != "09.00" || s.TimeEnd != "12.00" {
		t.Errorf("Expected time_start 09.00 and time_end 12.00, got %s / %s", s.TimeStart, s.TimeEnd)
	}
	if s.Category != "OUT_OF_SCHEDULE" {
		t.Errorf("Expected category OUT_OF_SCHEDULE, got %s", s.Category)
	}
}

func TestIngestUnsupportedFile(t *testing.T) {
	err := IngestFile(nil, Options{
		FilePath: "test.txt",
		RoundID:  "test_round",
	})
	if err == nil {
		t.Errorf("Expected error for unsupported extension .txt, got nil")
	}
}
