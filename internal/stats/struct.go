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

type StatBucket struct {
	StudentCount     int           `json:"student_count"`
	OccupancyRate    int           `json:"occupancy"` // Placeholder or calculated if you have capacity
	RoomCount        int           `json:"room_count"`
	TopSubjects      []SubjectStat `json:"top_subjects"`
	YearDistribution []YearStat    `json:"year_distribution"`
}

type DashboardResponse struct {
	Options []seater.RoundOption  `json:"options"` // Using your RoundOption struct
	Stats   map[string]StatBucket `json:"stats"`
}
