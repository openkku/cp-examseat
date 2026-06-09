package xlsx

import (
	"context"
	"fmt"
	"log"
	"regexp"
	"strconv"
	"strings"

	"cpkkuview/internal/database"
	"cpkkuview/internal/seater"

	"github.com/xuri/excelize/v2"
)

// ExtractAndMigrate processes the raw Excel file and populates SQLite tables
func ExtractAndMigrate(db database.Database, filePath string, roundID string, displayName string) error {
	fmt.Printf("📦 Migrating Round [%s] (%s) directly from Excel: %s\n", roundID, displayName, filePath)

	// 2. Open the Excel file
	f, err := excelize.OpenFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to open excel file: %w", err)
	}
	defer f.Close()

	var seats []database.Seats

	// 5. Parse worksheets
	sheets := f.GetSheetList()
	for _, sheetName := range sheets {
		rows, err := f.GetRows(sheetName)
		if err != nil {
			log.Printf("⚠️ Warning: Could not read rows in sheet %q: %v", sheetName, err)
			continue
		}

		rowPtr := 0
		for rowPtr < len(rows) {
			// Find next "ใบรายชื่อ"
			startRow := -1
			for r := rowPtr; r < len(rows); r++ {
				found := false
				for _, colVal := range rows[r] {
					if strings.Contains(colVal, "ใบรายชื่อ") {
						startRow = r
						found = true
						break
					}
				}
				if found {
					break
				}
			}

			if startRow == -1 {
				break // No more roster sections in this sheet
			}

			// Find header row and metadata
			headerRow := -1
			var room, subject, subjectName, section, timeVal string

			// Scan forward up to 10 rows from startRow for metadata block
			limit := startRow + 10
			if limit > len(rows) {
				limit = len(rows)
			}

			for r := startRow; r < limit; r++ {
				rowCells := rows[r]
				if len(rowCells) == 0 {
					continue
				}
				valA := rowCells[0]
				var valB string
				if len(rowCells) > 1 {
					valB = rowCells[1]
				}

				if strings.Contains(valA, "รายวิชา") {
					subjectRaw := strings.TrimSpace(valB)
					subjectRaw = strings.ReplaceAll(subjectRaw, ": ", "")
					subjectRaw = strings.TrimSpace(subjectRaw)

					// Parse subject code & name
					nbspIdx := strings.Index(subjectRaw, "\u00a0")
					spaceIdx := strings.Index(subjectRaw, " ")

					if nbspIdx != -1 {
						subject = strings.TrimSpace(subjectRaw[:nbspIdx])
						subjectName = strings.TrimSpace(subjectRaw[nbspIdx+len("\u00a0"):])
					} else if spaceIdx != -1 {
						subject = strings.TrimSpace(subjectRaw[:spaceIdx])
						subjectName = strings.TrimSpace(subjectRaw[spaceIdx+1:])
					} else {
						subject = subjectRaw
						subjectName = ""
					}

					// Section is typically in column F (index 5)
					var sectionRaw string
					if len(rowCells) > 5 {
						sectionRaw = rowCells[5]
					}
					section = strings.TrimSpace(strings.ReplaceAll(sectionRaw, "SEC.", ""))
				}

				if strings.Contains(valA, "เวลาสอบ") {
					timeRaw := strings.TrimSpace(valB)
					timeVal = strings.TrimSpace(strings.ReplaceAll(timeRaw, " น.", ""))
				}

				if strings.Contains(valA, "ห้องสอบ") {
					room = strings.TrimSpace(valB)
				}

				if strings.Contains(valB, "รหัส") {
					headerRow = r
					break
				}
			}

			if headerRow == -1 {
				rowPtr = startRow + 1
				continue
			}

			dataRow := headerRow + 1

			// Read students roster
			for dataRow < len(rows) {
				rowCells := rows[dataRow]
				var studentID, seat, note string

				if len(rowCells) > 1 {
					studentID = strings.TrimSpace(rowCells[1])
				}
				if len(rowCells) > 4 {
					seat = strings.TrimSpace(rowCells[4])
				}
				if len(rowCells) > 5 {
					note = strings.TrimSpace(rowCells[5])
				}

				if studentID == "" && seat == "" {
					break // End of roster section
				}

				cleanID := seater.NormalizeID(studentID)
				if cleanID != "" {
					cleanDate := parseThaiDate(sheetName)
					seats = append(seats, database.Seats{
						Sheet:       sheetName,
						Date:        cleanDate,
						Room:        room,
						Subject:     subject,
						SubjectName: subjectName,
						Section:     section,
						StudentID:   cleanID,
						Time:        timeVal,
						Seat:        seat,
						Note:        note,
						ExamRound:   roundID,
					})
				}

				dataRow++
			}

			rowPtr = dataRow
		}
	}

	ctx := context.Background()

	// Clear OLD data for this round
	fmt.Printf("   > Clearing existing data for round '%s'...\n", roundID)
	if err := db.PurgeRound(ctx, roundID); err != nil {
		return fmt.Errorf("failed to purge old round: %w", err)
	}

	// Insert NEW data for this round
	fmt.Printf("   > Saving new data for round '%s' (%d seats)...\n", roundID, len(seats))
	if err := db.AddRound(ctx, roundID, displayName, seats); err != nil {
		return fmt.Errorf("failed to add round data: %w", err)
	}

	fmt.Printf("\n✅ Success! Imported %d exams for round '%s' directly from Excel.\n", len(seats), displayName)
	return nil
}

// parseThaiDate translates sheet labels like "2 มี.ค. 68" to standard date format "2025-03-02"
func parseThaiDate(sheet string) string {
	re := regexp.MustCompile(`(\d+)\s*([^\d\s]+)\s*(\d+)`)
	matches := re.FindStringSubmatch(sheet)
	if len(matches) < 4 {
		return ""
	}
	day := matches[1]
	rawMonth := matches[2]
	yearTh := matches[3]
	cleanMonth := strings.ReplaceAll(rawMonth, ".", "")
	monthMap := map[string]string{
		"มค": "01", "กพ": "02", "มีค": "03", "เมย": "04",
		"พค": "05", "มิย": "06", "กค": "07", "สค": "08",
		"กย": "09", "ตค": "10", "พย": "11", "ธค": "12",
	}
	month, ok := monthMap[cleanMonth]
	if !ok {
		return ""
	}
	if len(day) == 1 {
		day = "0" + day
	}
	yInt, _ := strconv.Atoi(yearTh)
	yearAD := (2500 + yInt) - 543
	return fmt.Sprintf("%d-%s-%s", yearAD, month, day)
}
