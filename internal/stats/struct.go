package stats

import (
	"cpkkuview/internal/seater"
)

type SubjectStat struct {
	Code  string `json:"code"`
	Name  string `json:"name"`
	Count int    `json:"count"`
}

type YearStat struct {
	Year  string `json:"year"`
	Count int    `json:"count"`
}

type TimeslotStat struct {
	Time  string `json:"time"`
	Count int    `json:"count"`
}

type RoomStat struct {
	Room       string `json:"room"`
	SeatCount  int    `json:"seat_count"`
	DaysActive int    `json:"days_active"`
	Subjects   int    `json:"subjects"`
}

type DepartmentStat struct {
	Department string `json:"department"`
	Seatings   int    `json:"seatings"`
	Subjects   int    `json:"subjects"`
}

type PeakDayStat struct {
	Date     string `json:"date"`
	Count    int    `json:"count"`
	Students int    `json:"students"`
	Rooms    int    `json:"rooms"`
}

type StatBucket struct {
	StudentCount         int              `json:"student_count"`
	OccupancyRate        int              `json:"occupancy"` // Placeholder or calculated if you have capacity
	RoomCount            int              `json:"room_count"`
	TopSubjects          []SubjectStat    `json:"top_subjects"`
	YearDistribution     []YearStat       `json:"year_distribution"`
	TimeslotDistribution []TimeslotStat   `json:"timeslot_distribution"`
	RoomUtilization      []RoomStat       `json:"room_utilization"`
	DepartmentBreakdown  []DepartmentStat `json:"department_breakdown"`
	PeakDay              PeakDayStat      `json:"peak_day"`
	BackToBackCount      int              `json:"back_to_back_count"`
	AvgExamsPerStudent   float64          `json:"avg_exams_per_student"`
	TotalSeatings        int              `json:"total_seatings"`
}

type DashboardResponse struct {
	Options []seater.RoundOption  `json:"options"` // Using your RoundOption struct
	Stats   map[string]StatBucket `json:"stats"`
}
