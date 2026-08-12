package stats

import (
	"context"
	"cpkkuview/internal/database/sqlite"
	"cpkkuview/internal/seater"
	"path/filepath"
	"testing"
)

func TestGenerateDashboardStatsWithDB(t *testing.T) {
	dbPath := filepath.Join("../../data", "exams.db")
	db, err := sqlite.New(dbPath)
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}
	defer db.Close()

	roundMap := make(map[string]string)
	rounds, err := db.GetRounds(context.Background())
	if err != nil {
		t.Fatalf("failed to get rounds: %v", err)
	}
	for _, r := range rounds {
		roundMap[r.ID] = r.Label
	}

	allSeats, err := db.GetAllSeats(context.Background())
	if err != nil {
		t.Fatalf("failed to get all seats: %v", err)
	}

	allExams := make([]seater.ExamSchedule, len(allSeats))
	for i, s := range allSeats {
		allExams[i] = seater.ExamSchedule{
			Sheet:       s.ExamRound,
			Date:        s.Date,
			Time:        s.Time,
			Room:        s.Room,
			Subject:     s.Subject,
			SubjectName: s.SubjectName,
			StudentID:   s.StudentID,
			Branch:      s.Branch,
		}
	}

	GenerateDashboardStats(allExams, roundMap)

	if CachedStats == nil {
		t.Fatal("CachedStats is nil")
	}

	t.Logf("Generated stats for %d options", len(CachedStats.Options))
	for _, opt := range CachedStats.Options {
		stat, ok := CachedStats.Stats[opt.ID]
		if !ok {
			t.Errorf("Stats missing for option %s", opt.ID)
			continue
		}
		t.Logf("Option %s (%s): %d students, %d rooms, %d seatings, %d top_subjects, %d department_breakdowns",
			opt.ID, opt.Label, stat.StudentCount, stat.RoomCount, stat.TotalSeatings, len(stat.TopSubjects), len(stat.DepartmentBreakdown))
	}
}
