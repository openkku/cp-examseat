package base

type Seats struct {
	Sheet       string
	Date        string
	Room        string
	Subject     string
	SubjectName string
	Section     string
	StudentID   string
	Time        string
	Seat        string
	Note        string
	ExamRound   string
}

type SeatsOptions struct {
	StudentID string
	Round     *string
	Sheet     *string
}

type ExploreOptions struct {
	Round string
	Room  string
	Date  string
	Time  string
	Seat  *string
}

type ModeOptions struct {
	Mode  string
	Round string
	Date  string
	Time  string
}
