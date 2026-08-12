package stats

import (
	"cpkkuview/internal/seater"
	"fmt"
	"regexp"
	"sort"
	"strings"
	"sync"
)

var (
	statsMu     sync.RWMutex
	CachedStats *DashboardResponse
)

// GetCachedStats returns a copy or reference of CachedStats in a thread-safe manner
func GetCachedStats() *DashboardResponse {
	statsMu.RLock()
	defer statsMu.RUnlock()
	return CachedStats
}

var timeSpaceRegex = regexp.MustCompile(`\s*-\s*`)

func normalizeTime(t string) string {
	t = strings.Trim(t, "'\" \t")
	if t == "" {
		return ""
	}
	t = timeSpaceRegex.ReplaceAllString(t, "-")
	if !strings.Contains(t, "-") {
		return ""
	}
	return t
}

func getDepartment(subject string) string {
	subject = strings.TrimSpace(strings.ToUpper(subject))
	if len(subject) < 2 {
		return "Other"
	}
	prefix := subject[:2]
	switch prefix {
	case "CP":
		return "CP (Computer)"
	case "SC":
		return "SC (Science)"
	case "LI":
		return "LI (Language)"
	case "BS":
		return "BS (Basic Science)"
	case "EN":
		return "EN (Engineering)"
	case "HS":
		return "HS (Humanities)"
	case "TE":
		return "TE (Technology)"
	case "GE":
		return "GE (General Ed)"
	default:
		return "Other"
	}
}

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
		uniqueStudents     map[string]bool // The Source of Truth for Headcount
		rooms              map[string]bool
		subjects           map[string]string
		subCounts          map[string]int
		timeslotCounts     map[string]int
		roomSeats          map[string]int
		roomDays           map[string]map[string]bool
		roomSubjects       map[string]map[string]bool
		departmentSeatings map[string]int
		departmentSubjects map[string]map[string]bool
		dayExamCounts      map[string]int
		dayStudents        map[string]map[string]bool
		dayRooms           map[string]map[string]bool
		studentDayTimes    map[string]map[string]map[string]bool
		totalSeatings      int
	}

	tempData := make(map[string]*tempBucket)

	// Function to create a clean bucket
	initBucket := func() *tempBucket {
		return &tempBucket{
			uniqueStudents:     make(map[string]bool),
			rooms:              make(map[string]bool),
			subjects:           make(map[string]string),
			subCounts:          make(map[string]int),
			timeslotCounts:     make(map[string]int),
			roomSeats:          make(map[string]int),
			roomDays:           make(map[string]map[string]bool),
			roomSubjects:       make(map[string]map[string]bool),
			departmentSeatings: make(map[string]int),
			departmentSubjects: make(map[string]map[string]bool),
			dayExamCounts:      make(map[string]int),
			dayStudents:        make(map[string]map[string]bool),
			dayRooms:           make(map[string]map[string]bool),
			studentDayTimes:    make(map[string]map[string]map[string]bool),
			totalSeatings:      0,
		}
	}

	// Initialize Global Bucket
	tempData["global"] = initBucket()

	// Pre-initialize options for all rounds specified in roundLabels
	for roundID, label := range roundLabels {
		if roundID == "" {
			continue
		}
		if _, exists := tempData[roundID]; !exists {
			tempData[roundID] = initBucket()
			if label == "" {
				label = fmt.Sprintf("Round: %s", roundID)
			}
			response.Options = append(response.Options, seater.RoundOption{
				ID: roundID, Label: label,
			})
		}
	}

	// 1. MAIN LOOP: COLLECT RAW DATA
	for _, exam := range exams {
		roundID := exam.ExamRound
		if roundID == "" {
			roundID = exam.Sheet
		}
		if roundID == "" {
			continue
		}

		// Init round if new and not in roundLabels
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
			b.totalSeatings++

			// Store Unique Student ID
			studentID := strings.TrimSpace(exam.StudentID)
			if studentID != "" {
				b.uniqueStudents[studentID] = true
			}

			// Store Room
			roomName := strings.TrimSpace(exam.Room)
			if roomName != "" {
				b.rooms[roomName] = true
				b.roomSeats[roomName]++
				if b.roomDays[roomName] == nil {
					b.roomDays[roomName] = make(map[string]bool)
				}
				if exam.Date != "" {
					b.roomDays[roomName][exam.Date] = true
				}
				if b.roomSubjects[roomName] == nil {
					b.roomSubjects[roomName] = make(map[string]bool)
				}
				if exam.Subject != "" {
					b.roomSubjects[roomName][exam.Subject] = true
				}
			}

			// Count Subject Seats
			if exam.Subject != "" {
				b.subjects[exam.Subject] = exam.SubjectName
				b.subCounts[exam.Subject]++

				dept := getDepartment(exam.Subject)
				b.departmentSeatings[dept]++
				if b.departmentSubjects[dept] == nil {
					b.departmentSubjects[dept] = make(map[string]bool)
				}
				b.departmentSubjects[dept][exam.Subject] = true
			}

			// Timeslot counts
			normTime := normalizeTime(exam.Time)
			if normTime != "" {
				b.timeslotCounts[normTime]++
			}

			// Day stats
			if exam.Date != "" {
				b.dayExamCounts[exam.Date]++
				if b.dayStudents[exam.Date] == nil {
					b.dayStudents[exam.Date] = make(map[string]bool)
				}
				if studentID != "" {
					b.dayStudents[exam.Date][studentID] = true
				}
				if b.dayRooms[exam.Date] == nil {
					b.dayRooms[exam.Date] = make(map[string]bool)
				}
				if roomName != "" {
					b.dayRooms[exam.Date][roomName] = true
				}
			}

			// Student date timeslot for back-to-back
			if studentID != "" && exam.Date != "" && normTime != "" {
				if b.studentDayTimes[studentID] == nil {
					b.studentDayTimes[studentID] = make(map[string]map[string]bool)
				}
				if b.studentDayTimes[studentID][exam.Date] == nil {
					b.studentDayTimes[studentID][exam.Date] = make(map[string]bool)
				}
				b.studentDayTimes[studentID][exam.Date][normTime] = true
			}
		}
	}

	// 2. POST-PROCESSING: CALCULATE STATS
	for id, bucket := range tempData {

		// A. Calculate Year Distribution from UNIQUE students only
		yearCounts := make(map[string]int)
		for studentID := range bucket.uniqueStudents {
			s := strings.TrimLeft(studentID, "'\"")
			if len(s) >= 2 {
				prefix := s[:2]
				yearCounts[prefix]++
			}
		}

		finalBucket := StatBucket{
			StudentCount:         len(bucket.uniqueStudents),
			RoomCount:            len(bucket.rooms),
			OccupancyRate:        0,
			TopSubjects:          make([]SubjectStat, 0),
			YearDistribution:     make([]YearStat, 0),
			TimeslotDistribution: make([]TimeslotStat, 0),
			RoomUtilization:      make([]RoomStat, 0),
			DepartmentBreakdown:  make([]DepartmentStat, 0),
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

		// D. Process Timeslots
		for tSlot, count := range bucket.timeslotCounts {
			if tSlot != "" {
				finalBucket.TimeslotDistribution = append(finalBucket.TimeslotDistribution, TimeslotStat{Time: tSlot, Count: count})
			}
		}
		sort.Slice(finalBucket.TimeslotDistribution, func(i, j int) bool {
			return finalBucket.TimeslotDistribution[i].Time < finalBucket.TimeslotDistribution[j].Time
		})

		// E. Process Room utilization
		for r, count := range bucket.roomSeats {
			if r != "" {
				finalBucket.RoomUtilization = append(finalBucket.RoomUtilization, RoomStat{
					Room:       r,
					SeatCount:  count,
					DaysActive: len(bucket.roomDays[r]),
					Subjects:   len(bucket.roomSubjects[r]),
				})
			}
		}
		sort.Slice(finalBucket.RoomUtilization, func(i, j int) bool {
			return finalBucket.RoomUtilization[i].SeatCount > finalBucket.RoomUtilization[j].SeatCount
		})

		// F. Process Department breakdown
		for d, count := range bucket.departmentSeatings {
			finalBucket.DepartmentBreakdown = append(finalBucket.DepartmentBreakdown, DepartmentStat{
				Department: d,
				Seatings:   count,
				Subjects:   len(bucket.departmentSubjects[d]),
			})
		}
		sort.Slice(finalBucket.DepartmentBreakdown, func(i, j int) bool {
			return finalBucket.DepartmentBreakdown[i].Seatings > finalBucket.DepartmentBreakdown[j].Seatings
		})

		// G. Peak Day (deterministic date ordering for tie breaking)
		var dates []string
		for d := range bucket.dayExamCounts {
			dates = append(dates, d)
		}
		sort.Strings(dates)

		var peakDate string
		var peakCount int
		for _, d := range dates {
			count := bucket.dayExamCounts[d]
			if count > peakCount {
				peakCount = count
				peakDate = d
			}
		}
		if peakDate != "" {
			finalBucket.PeakDay = PeakDayStat{
				Date:     peakDate,
				Count:    peakCount,
				Students: len(bucket.dayStudents[peakDate]),
				Rooms:    len(bucket.dayRooms[peakDate]),
			}
		}

		// H. Back-to-Back Count
		backToBack := 0
		for _, daysMap := range bucket.studentDayTimes {
			for _, timesSlots := range daysMap {
				validSlots := 0
				for slot := range timesSlots {
					if slot == "08.30-11.30" || slot == "13.00-16.00" {
						validSlots++
					}
				}
				if validSlots >= 2 {
					backToBack++
				}
			}
		}
		finalBucket.BackToBackCount = backToBack

		// I. Averages and Totals
		finalBucket.TotalSeatings = bucket.totalSeatings
		if len(bucket.uniqueStudents) > 0 {
			finalBucket.AvgExamsPerStudent = float64(bucket.totalSeatings) / float64(len(bucket.uniqueStudents))
		}

		response.Stats[id] = finalBucket
	}

	// Sort the non-global options chronologically descending
	if len(response.Options) > 1 {
		sort.Slice(response.Options[1:], func(i, j int) bool {
			return seater.CompareRounds(response.Options[1+i].ID, response.Options[1+j].ID)
		})
	}

	statsMu.Lock()
	CachedStats = response
	statsMu.Unlock()

	fmt.Println("✅ Stats Ready!")
}
