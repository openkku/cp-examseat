package seater

// Matches your JSON structure
type ExamSchedule struct {
	Sheet       string   `json:"sheet"`
	ExamRound   string   `json:"exam_round,omitempty"`
	Category    string   `json:"category,omitempty"`
	Date        string   `json:"date"`
	Time        string   `json:"time"`
	TimeStart   string   `json:"time_start,omitempty"`
	TimeEnd     string   `json:"time_end,omitempty"`
	Room        string   `json:"room"`
	Subject     string   `json:"subject"`
	SubjectName string   `json:"subject_name"`
	Section     string   `json:"section"`
	StudentID   string   `json:"student_id"`
	Seat        string   `json:"seat"`
	Note        string   `json:"note"`
	Branch      string   `json:"branch"`
	Labels      []string `json:"labels,omitempty"`
	RoomLayout  string   `json:"room_layout,omitempty"`
	CustomID    string   `json:"custom_id,omitempty"`
}

type RoundOption struct {
	ID    string `json:"id"`
	Label string `json:"label"`
}


