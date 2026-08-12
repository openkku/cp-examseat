package main

import (
	"cpkkuview/internal/config"
	"cpkkuview/internal/database/sqlite"
	"cpkkuview/internal/ingest"
	"cpkkuview/internal/seater"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	arg1 := os.Args[1]

	// Check if running in custom subcommand mode or --custom flag mode
	if arg1 == "custom" || arg1 == "--custom" {
		runCustomMigrate(os.Args[2:])
		return
	}

	// Legacy mode: go run cmd/migrate/migrate.go <FILE_PATH> <ROUND_ID> [DISPLAY_NAME]
	if len(os.Args) < 3 {
		printUsage()
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

	err = ingest.IngestFile(db, ingest.Options{
		FilePath:    filePath,
		RoundID:     roundID,
		DisplayName: displayName,
	})
	if err != nil {
		log.Fatalf("❌ Migration failed: %v", err)
	}
}

func runCustomMigrate(args []string) {
	customCmd := flag.NewFlagSet("custom", flag.ExitOnError)
	filePath := customCmd.String("file", "", "Path to the exam schedule file (.pdf, .xlsx, .json)")
	roundID := customCmd.String("round", "", "Round ID (e.g., 2_2568)")
	displayName := customCmd.String("display", "", "Round display name")
	labelsStr := customCmd.String("labels", "", "Comma-separated exam labels (e.g. LAB,Lab)")
	roomLayout := customCmd.String("room-layout", "", "Custom room layout key (e.g. CP9421_LAB)")
	customID := customCmd.String("custom-id", "", "Custom dataset ID for scoped purging (e.g. FINAL_2_OOP_LAB_2026)")

	if err := customCmd.Parse(args); err != nil {
		log.Fatalf("Failed to parse custom migration flags: %v", err)
	}

	if *filePath == "" || *roundID == "" {
		fmt.Println("❌ Error: Both --file and --round parameters are required for custom migration.")
		fmt.Println("   Usage: go run cmd/migrate/migrate.go custom --file <PATH> --round <ROUND_ID> [--custom-id <ID>] [--labels L1,L2] [--room-layout LAYOUT]")
		os.Exit(1)
	}

	finalDisplayName := *displayName
	if finalDisplayName == "" {
		finalDisplayName = formatDefaultLabel(*roundID)
	}

	labels := seater.ParseLabels(*labelsStr)

	dbPath := filepath.Join(config.GetDataDir(), "exams.db")
	db, err := sqlite.New(dbPath)
	if err != nil {
		log.Fatalf("❌ Migration failed: %v", err)
	}
	defer db.Close()

	err = ingest.IngestFile(db, ingest.Options{
		FilePath:    *filePath,
		RoundID:     *roundID,
		DisplayName: finalDisplayName,
		Labels:      labels,
		RoomLayout:  *roomLayout,
		CustomID:    *customID,
	})
	if err != nil {
		log.Fatalf("❌ Custom migration failed: %v", err)
	}
}

func printUsage() {
	fmt.Println("❌ Usage:")
	fmt.Println("   Standard Migration:")
	fmt.Println("     go run cmd/migrate/migrate.go <FILE_PATH> <ROUND_ID> [DISPLAY_NAME]")
	fmt.Println("     Example: go run cmd/migrate/migrate.go data/source/final_2_2568.xlsx 2_2568 \"Final Exam 2/2568\"")
	fmt.Println("")
	fmt.Println("   Custom Edge-Case Migration:")
	fmt.Println("     go run cmd/migrate/migrate.go custom --file <PATH> --round <ROUND_ID> [--custom-id ID] [--labels L1,L2] [--room-layout LAYOUT]")
	fmt.Println("     Example: go run cmd/migrate/migrate.go custom --file data/source/custom/Lab_2568_CP421024_OOP_CY_FinalExam_Sec1.pdf --round 2_2568 --custom-id FINAL_2_OOP_LAB_2026 --labels LAB,Lab --room-layout CP9421_LAB")
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
