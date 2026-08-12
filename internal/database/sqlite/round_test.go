package sqlite_test

import (
	"context"
	"cpkkuview/internal/base"
	"cpkkuview/internal/database"
	"cpkkuview/internal/database/sqlite"
	"cpkkuview/internal/room"
	"path/filepath"
	"testing"
)

func TestMultiLabelAndCustomIDPurge(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")

	db, err := sqlite.New(dbPath)
	if err != nil {
		t.Fatalf("Failed to create sqlite DB: %v", err)
	}
	defer db.Close()

	ctx := context.Background()
	roundID := "2_2568"

	// 1. Add Main Seats
	mainSeats := []database.Seats{
		{
			ExamRound:   roundID,
			StudentID:   "683380010-2",
			Subject:     "CP1000",
			SubjectName: "Computer Intro",
			Date:        "2026-03-20",
			Time:        "09.00 - 12.00",
			Room:        "SC101",
			Seat:        "A01",
			CustomID:    "MAIN_2_2568",
			Labels:      nil,
		},
	}
	if err := db.AddRound(ctx, roundID, "Final 2/2568", mainSeats); err != nil {
		t.Fatalf("Failed to add main seats: %v", err)
	}

	// 2. Add Lab Seats with Custom ID
	labSeats := []database.Seats{
		{
			ExamRound:   roundID,
			StudentID:   "683380010-2",
			Subject:     "CP421024",
			SubjectName: "OOP",
			Date:        "2026-03-22",
			Time:        "17.00 - 19.00",
			Room:        "CP9421",
			Seat:        "CP9421-67",
			CustomID:    "FINAL_2_OOP_LAB_2026",
			Labels:      []string{"LAB", "Lab"},
			RoomLayout:  "CP9421_LAB",
		},
	}
	if err := db.AddRound(ctx, roundID, "Final 2/2568", labSeats); err != nil {
		t.Fatalf("Failed to add lab seats: %v", err)
	}

	// 3. Query student seats and verify both main and lab seats return together
	seats, err := db.GetSeatsByID(ctx, base.SeatsOptions{StudentID: "683380010-2", Round: &roundID})
	if err != nil {
		t.Fatalf("Failed to GetSeatsByID: %v", err)
	}

	if len(seats) != 2 {
		t.Fatalf("Expected 2 seats (main + lab), got %d", len(seats))
	}

	// Verify lab seat labels
	var foundLab bool
	for _, s := range seats {
		if s.Subject == "CP421024" {
			foundLab = true
			if len(s.Labels) != 2 || s.Labels[0] != "LAB" || s.Labels[1] != "Lab" {
				t.Errorf("Expected labels ['LAB', 'Lab'], got %v", s.Labels)
			}
			if s.RoomLayout != "CP9421_LAB" {
				t.Errorf("Expected room_layout CP9421_LAB, got %s", s.RoomLayout)
			}
		}
	}
	if !foundLab {
		t.Errorf("Lab seat CP421024 was not found in query results")
	}

	// 4. Test Scoped Purging by custom_id
	if err := db.PurgeCustomDataset(ctx, roundID, "FINAL_2_OOP_LAB_2026"); err != nil {
		t.Fatalf("Failed to PurgeCustomDataset: %v", err)
	}

	// Query again: only main seat should remain
	seatsAfterPurge, err := db.GetSeatsByID(ctx, base.SeatsOptions{StudentID: "683380010-2", Round: &roundID})
	if err != nil {
		t.Fatalf("Failed to GetSeatsByID after purge: %v", err)
	}

	if len(seatsAfterPurge) != 1 {
		t.Fatalf("Expected 1 seat after scoped purge, got %d", len(seatsAfterPurge))
	}
	if seatsAfterPurge[0].Subject != "CP1000" {
		t.Errorf("Expected remaining seat subject CP1000, got %s", seatsAfterPurge[0].Subject)
	}
}

func TestGetOptionsCascadeFilter(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test_options.db")

	db, err := sqlite.New(dbPath)
	if err != nil {
		t.Fatalf("Failed to create database: %v", err)
	}
	defer db.Close()

	ctx := context.Background()
	roundID := "test_cascade_round"

	// Mock valid room in room.RoomCache
	room.RoomCache["CP.9127"] = map[string]interface{}{"i_layout": "CP.9127.webp"}
	defer func() {
		delete(room.RoomCache, "CP.9127")
	}()

	seats := []database.Seats{
		{
			ExamRound: roundID,
			StudentID: "11111",
			Date:      "2026-08-23",
			Time:      "13.00-16.00",
			Room:      "ห้อง 9525, 9127", // Unconfigured/invalid room
			Subject:   "CP422022",
		},
		{
			ExamRound: roundID,
			StudentID: "22222",
			Date:      "2026-08-24",
			Time:      "08.30-11.30",
			Room:      "CP.9127", // Valid room
			Subject:   "CP352001",
		},
	}

	if err := db.AddRound(ctx, roundID, "Test Cascade", seats); err != nil {
		t.Fatalf("AddRound failed: %v", err)
	}

	// 1. Test "dates" mode: 2026-08-23 should be filtered out, only 2026-08-24 returned
	dates, err := db.GetOptions(ctx, base.ModeOptions{Mode: "dates", Round: roundID})
	if err != nil {
		t.Fatalf("GetOptions dates failed: %v", err)
	}
	if len(dates) != 1 || dates[0] != "2026-08-24" {
		t.Errorf("Expected dates ['2026-08-24'], got %v", dates)
	}

	// 2. Test "times" mode for valid date
	times, err := db.GetOptions(ctx, base.ModeOptions{Mode: "times", Round: roundID, Date: "2026-08-24"})
	if err != nil {
		t.Fatalf("GetOptions times failed: %v", err)
	}
	if len(times) != 1 || times[0] != "08.30-11.30" {
		t.Errorf("Expected times ['08.30-11.30'], got %v", times)
	}

	// 3. Test "rooms" mode for valid time slot
	rooms, err := db.GetOptions(ctx, base.ModeOptions{Mode: "rooms", Round: roundID, Date: "2026-08-24", Time: "08.30-11.30"})
	if err != nil {
		t.Fatalf("GetOptions rooms failed: %v", err)
	}
	if len(rooms) != 1 || rooms[0] != "CP.9127" {
		t.Errorf("Expected rooms ['CP.9127'], got %v", rooms)
	}

	// 4. Test "rooms" mode for invalid time slot: should return empty slice
	invalidRooms, err := db.GetOptions(ctx, base.ModeOptions{Mode: "rooms", Round: roundID, Date: "2026-08-23", Time: "13.00-16.00"})
	if err != nil {
		t.Fatalf("GetOptions invalid rooms failed: %v", err)
	}
	if len(invalidRooms) != 0 {
		t.Errorf("Expected empty rooms slice for invalid room slot, got %v", invalidRooms)
	}
}
