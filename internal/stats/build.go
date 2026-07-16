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
			b.totalSeatings++

			// Store Unique Student ID
			if exam.StudentID != "" {
				b.uniqueStudents[exam.StudentID] = true
			}

			// Store Room
			if exam.Room != "" {
				b.rooms[exam.Room] = true
				b.roomSeats[exam.Room]++
				if b.roomDays[exam.Room] == nil {
					b.roomDays[exam.Room] = make(map[string]bool)
				}
				if exam.Date != "" {
					b.roomDays[exam.Room][exam.Date] = true
				}
				if b.roomSubjects[exam.Room] == nil {
					b.roomSubjects[exam.Room] = make(map[string]bool)
				}
				if exam.Subject != "" {
					b.roomSubjects[exam.Room][exam.Subject] = true
				}
			}

			// Count Subject Seats
			if exam.Subject != "" {
				b.subjects[exam.Subject] = exam.SubjectName
				b.subCounts[exam.Subject]++

				// Department prefix logic
				var dept string
				if len(exam.Subject) >= 2 {
					prefix := exam.Subject[:2]
					if prefix == "CP" {
						dept = "CP (Computer)"
					} else if prefix == "SC" {
						dept = "SC (Science)"
					} else if prefix == "LI" {
						dept = "LI (Language)"
					} else {
						dept = "Other"
					}
				} else {
					dept = "Other"
				}
				b.departmentSeatings[dept]++
				if b.departmentSubjects[dept] == nil {
					b.departmentSubjects[dept] = make(map[string]bool)
				}
				b.departmentSubjects[dept][exam.Subject] = true
			}

			// Timeslot counts
			if exam.Time != "" {
				tSlot := exam.Time
				if tSlot == "13.00 -16.00" {
					tSlot = "13.00-16.00"
				}
				b.timeslotCounts[tSlot]++
			}

			// Day stats
			if exam.Date != "" {
				b.dayExamCounts[exam.Date]++
				if b.dayStudents[exam.Date] == nil {
					b.dayStudents[exam.Date] = make(map[string]bool)
				}
				if exam.StudentID != "" {
					b.dayStudents[exam.Date][exam.StudentID] = true
				}
				if b.dayRooms[exam.Date] == nil {
					b.dayRooms[exam.Date] = make(map[string]bool)
				}
				if exam.Room != "" {
					b.dayRooms[exam.Date][exam.Room] = true
				}
			}

			// Student date timeslot for back-to-back
			if exam.StudentID != "" && exam.Date != "" && exam.Time != "" {
				tSlot := exam.Time
				if tSlot == "13.00 -16.00" {
					tSlot = "13.00-16.00"
				}
				if b.studentDayTimes[exam.StudentID] == nil {
					b.studentDayTimes[exam.StudentID] = make(map[string]map[string]bool)
				}
				if b.studentDayTimes[exam.StudentID][exam.Date] == nil {
					b.studentDayTimes[exam.StudentID][exam.Date] = make(map[string]bool)
				}
				b.studentDayTimes[exam.StudentID][exam.Date][tSlot] = true
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

		// G. Peak Day
		var peakDate string
		var peakCount int
		for d, count := range bucket.dayExamCounts {
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

	CachedStats = response
	fmt.Println("✅ Stats Ready!")
}
