package main

import (
	"cpkkuview/internal/config"
	"cpkkuview/internal/database/sqlite"
	"cpkkuview/internal/xlsx"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	if len(os.Args) < 3 {
		fmt.Println("❌ Usage: go run cmd/migrate/migrate.go <XLSX_FILE_PATH> <ROUND_ID> [DISPLAY_NAME]")
		fmt.Println("   Example: go run cmd/migrate/migrate.go original_exam_table/final_2_2568.xlsx 2_2568 \"Final Exam 2/2568\"")
		os.Exit(1)
	}

	filePath := os.Args[1]
	roundID := os.Args[2]

	displayName := formatDefaultLabel(roundID)
	if len(os.Args) > 3 {
		displayName = os.Args[3]
	}

	dbPath := filepath.Join(config.GetDataDir(), "exams.db")
	db, err := sqlite.New(dbPath)
	if err != nil {
		log.Fatalf("❌ Migration failed: %v", err)
	}
	defer db.Close()

	err = xlsx.ExtractAndMigrate(db, filePath, roundID, displayName)
	if err != nil {
		log.Fatalf("❌ Migration failed: %v", err)
	}
}

func formatDefaultLabel(roundID string) string {
	parts := strings.Split(roundID, "_")
	if len(parts) == 3 {
		term := parts[0]
		semester := parts[1]
		year := parts[2]
		if term == "mid" {
			return fmt.Sprintf("กลางภาค %s/%s", semester, year)
		} else if term == "final" {
			return fmt.Sprintf("ปลายภาค %s/%s", semester, year)
		}
	}
	return roundID
}
