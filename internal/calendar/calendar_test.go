package calendar

import (
	"strings"
	"testing"

	"cpkkuview/internal/base"
)

func TestGenerate(t *testing.T) {
	seats := []base.Seats{
		{
			StudentID:   "653380123-4",
			Date:        "2026-06-10",
			Time:        "09.00 - 12.00",
			Subject:     "CP001001",
			SubjectName: "Introduction to Computer Science",
			Section:     "1",
			Room:        "Building 3 Room 301",
			Seat:        "A1",
			ExamRound:   "midterm",
		},
	}

	icsBytes, err := Generate(seats)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	icsStr := string(icsBytes)
	expectedName := "NAME:CP KKU Exam Seats (653380123-4)"
	expectedCalName := "X-WR-CALNAME:CP KKU Exam Seats (653380123-4)"

	if !strings.Contains(icsStr, expectedName) {
		t.Errorf("expected calendar to contain %q, but got:\n%s", expectedName, icsStr)
	}
	if !strings.Contains(icsStr, expectedCalName) {
		t.Errorf("expected calendar to contain %q, but got:\n%s", expectedCalName, icsStr)
	}
}

func TestGenerate_Empty(t *testing.T) {
	icsBytes, err := Generate(nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	icsStr := string(icsBytes)
	expectedName := "NAME:CP KKU Exam Seats"
	expectedCalName := "X-WR-CALNAME:CP KKU Exam Seats"

	if !strings.Contains(icsStr, expectedName) {
		t.Errorf("expected calendar to contain %q, but got:\n%s", expectedName, icsStr)
	}
	if !strings.Contains(icsStr, expectedCalName) {
		t.Errorf("expected calendar to contain %q, but got:\n%s", expectedCalName, icsStr)
	}
}
