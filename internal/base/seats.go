package base

type Seats struct {
	Sheet       string
	Date        string
	Time        string
	TimeStart   string
	TimeEnd     string
	Category    string
	Room        string
	Subject     string
	SubjectName string
	Section     string
	StudentID   string
	Seat        string
	Note        string
	ExamRound   string
	Branch      string
	Labels      []string
	RoomLayout  string
	CustomID    string
}

func (s *Seats) GetDate() string {
	return s.Date
}

func (s *Seats) GetTime() string {
	if s.TimeStart != "" {
		if s.TimeEnd != "" {
			return s.TimeStart + "-" + s.TimeEnd
		}
		return s.TimeStart
	}
	return s.Time
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
