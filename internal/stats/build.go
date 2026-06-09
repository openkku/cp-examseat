package stats

import (
	"cpkkuview/internal/seater"
	"fmt"
	"sort"
)

// CachedStats stores the calculated stats in memory
var CachedStats *DashboardResponse

// GenerateDashboardStats processes the raw list into the dashboard structure
func GenerateDashboardStats(exams []seater.ExamSchedule, roundLabels map[string]string) {
	fmt.Println("⏳ Generating Dashboard Stats by Exam Round...")

	response := &DashboardResponse{
		Options: []seater.RoundOption{
			{ID: "global", Label: "Global View (All Rounds)"},
		},
		Stats: make(map[string]StatBucket),
	}

	// Helper bucket
	type tempBucket struct {
		uniqueStudents map[string]bool // The Source of Truth for Headcount
		rooms          map[string]bool
		subjects       map[string]string
		subCounts      map[string]int
		// Note: We don't count years here anymore to avoid duplicates
	}

	tempData := make(map[string]*tempBucket)

	// Function to create a clean bucket
	initBucket := func() *tempBucket {
		return &tempBucket{
			uniqueStudents: make(map[string]bool),
			rooms:          make(map[string]bool),
			subjects:       make(map[string]string),
			subCounts:      make(map[string]int),
		}
	}

	// Initialize Global Bucket
	tempData["global"] = initBucket()

	// 1. MAIN LOOP: COLLECT RAW DATA
	for _, exam := range exams {
		roundID := exam.Sheet

		// Init round if new
		if _, exists := tempData[roundID]; !exists {
			tempData[roundID] = initBucket()

			label := roundLabels[roundID]
			if label == "" {
				label = fmt.Sprintf("Round: %s", roundID)
			}
			response.Options = append(response.Options, seater.RoundOption{
				ID: roundID, Label: label,
			})
		}

		// Add data to both specific round AND global bucket
		targets := []string{"global", roundID}
		for _, t := range targets {
			b := tempData[t]

			// Store Unique Student ID
			if exam.StudentID != "" {
				b.uniqueStudents[exam.StudentID] = true
			}

			// Store Room
			if exam.Room != "" {
				b.rooms[exam.Room] = true
			}

			// Count Subject Seats (We still want total volume for "Top Subjects")
			if exam.Subject != "" {
				b.subjects[exam.Subject] = exam.SubjectName
				b.subCounts[exam.Subject]++
			}
		}
	}

	// 2. POST-PROCESSING: CALCULATE STATS
	for id, bucket := range tempData {

		// A. Calculate Year Distribution from UNIQUE students only
		yearCounts := make(map[string]int)
		for studentID := range bucket.uniqueStudents {
			if len(studentID) >= 2 {
				prefix := studentID[:2]
				yearCounts[prefix]++
			}
		}

		finalBucket := StatBucket{
			StudentCount:  len(bucket.uniqueStudents),
			RoomCount:     len(bucket.rooms),
			OccupancyRate: 0,
		}

		// B. Process Subjects (Sort High -> Low)
		for code, count := range bucket.subCounts {
			name := bucket.subjects[code]
			if name == "" {
				name = code
			}
			finalBucket.TopSubjects = append(finalBucket.TopSubjects, SubjectStat{Code: code, Name: name, Count: count})
		}
		sort.Slice(finalBucket.TopSubjects, func(i, j int) bool { return finalBucket.TopSubjects[i].Count > finalBucket.TopSubjects[j].Count })

		// C. Process Years (Sort Newest -> Oldest)
		for y, count := range yearCounts {
			finalBucket.YearDistribution = append(finalBucket.YearDistribution, YearStat{Year: y, Count: count})
		}
		sort.Slice(finalBucket.YearDistribution, func(i, j int) bool {
			return finalBucket.YearDistribution[i].Year > finalBucket.YearDistribution[j].Year
		})

		response.Stats[id] = finalBucket
	}

	CachedStats = response
	fmt.Println("✅ Stats Ready!")
}
