package ingest

import (
	"context"
	"cpkkuview/internal/base"
	"cpkkuview/internal/database"
	"cpkkuview/internal/pdf"
	"cpkkuview/internal/xlsx"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type Options struct {
	FilePath    string
	RoundID     string
	DisplayName string
	Labels      []string
	RoomLayout  string
	CustomID    string
}

// IngestFile reads an Excel, PDF, or JSON seating file and imports seats into the database.
func IngestFile(db database.Database, opts Options) error {
	ext := strings.ToLower(filepath.Ext(opts.FilePath))
	var seats []base.Seats
	var err error

	fmt.Printf("📦 Ingesting file [%s] for round '%s' (Custom ID: '%s', Labels: %v)\n", opts.FilePath, opts.RoundID, opts.CustomID, opts.Labels)

	switch ext {
	case ".pdf":
		seats, err = pdf.ExtractSeats(opts.FilePath, opts.RoundID, opts.Labels, opts.RoomLayout, opts.CustomID)
	case ".xlsx", ".xls":
		seats, err = xlsx.ExtractSeats(opts.FilePath, opts.RoundID, opts.Labels, opts.RoomLayout, opts.CustomID)
	case ".json":
		seats, err = parseJSONSeats(opts.FilePath, opts.RoundID, opts.Labels, opts.RoomLayout, opts.CustomID)
	default:
		return fmt.Errorf("unsupported file extension %q (supported: .pdf, .xlsx, .json)", ext)
	}

	if err != nil {
		return fmt.Errorf("failed to extract seats from %s: %w", opts.FilePath, err)
	}

	ctx := context.Background()

	// Collect unique custom_ids from options and individual seats (if ingesting JSON)
	customIDsToPurge := make(map[string]bool)
	if opts.CustomID != "" {
		customIDsToPurge[opts.CustomID] = true
	}
	for _, s := range seats {
		if s.CustomID != "" {
			customIDsToPurge[s.CustomID] = true
		}
	}

	if len(customIDsToPurge) > 0 {
		for cid := range customIDsToPurge {
			fmt.Printf("   > Purging old entries for round '%s' and custom_id '%s'...\n", opts.RoundID, cid)
			if err := db.PurgeCustomDataset(ctx, opts.RoundID, cid); err != nil {
				return fmt.Errorf("failed to purge custom dataset '%s': %w", cid, err)
			}
		}
	} else {
		fmt.Printf("   > Purging old entries for round '%s'...\n", opts.RoundID)
		if err := db.PurgeRound(ctx, opts.RoundID); err != nil {
			return fmt.Errorf("failed to purge round: %w", err)
		}
	}

	fmt.Printf("   > Saving %d seats into database...\n", len(seats))
	if err := db.AddRound(ctx, opts.RoundID, opts.DisplayName, seats); err != nil {
		return fmt.Errorf("failed to save round seats: %w", err)
	}

	fmt.Printf("✅ Ingestion complete! Successfully saved %d seats for round '%s'.\n", len(seats), opts.RoundID)
	return nil
}

func parseJSONSeats(filePath string, roundID string, defaultLabels []string, roomLayout string, customID string) ([]base.Seats, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read json file: %w", err)
	}

	var seats []base.Seats
	if err := json.Unmarshal(data, &seats); err != nil {
		return nil, fmt.Errorf("failed to parse json seats: %w", err)
	}

	for i := range seats {
		if seats[i].ExamRound == "" {
			seats[i].ExamRound = roundID
		}
		if len(seats[i].Labels) == 0 && len(defaultLabels) > 0 {
			seats[i].Labels = defaultLabels
		}
		if seats[i].RoomLayout == "" && roomLayout != "" {
			seats[i].RoomLayout = roomLayout
		}
		if seats[i].CustomID == "" && customID != "" {
			seats[i].CustomID = customID
		}
	}

	return seats, nil
}
