package seater

// Matches your JSON structure
type ExamSchedule struct {
	Sheet       string `json:"sheet"`
	Date        string `json:"date"`
	Time        string `json:"time"`
	Room        string `json:"room"`
	Subject     string `json:"subject"`
	SubjectName string `json:"subject_name"`
	Section     string `json:"section"`
	StudentID   string `json:"student_id"`
	Seat        string `json:"seat"`
	Note        string `json:"note"`
}

type RoundOption struct {
	ID    string `json:"id"`
	Label string `json:"label"`
}
