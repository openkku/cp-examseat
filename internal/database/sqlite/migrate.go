package sqlite

import (
	"log"
)

func (d *Database) migrate() {
	d.db.Exec("PRAGMA foreign_keys = ON;")

	schema := `
    CREATE TABLE IF NOT EXISTS exams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exam_round TEXT,
        student_id TEXT,
        sheet TEXT,
        date TEXT, 
        time TEXT,
        room TEXT,
        subject TEXT,
        section TEXT,
        seat TEXT,
        note TEXT,
        UNIQUE(exam_round, student_id, subject)
    );
    CREATE INDEX IF NOT EXISTS idx_student_round ON exams(student_id, exam_round);
    CREATE INDEX IF NOT EXISTS idx_room_time ON exams(room, time);
    CREATE INDEX IF NOT EXISTS idx_exams_query ON exams(exam_round, date, time, room);
    
    CREATE TABLE IF NOT EXISTS subjects (
        id TEXT,
        exam_round TEXT,
        name TEXT,
        PRIMARY KEY (id, exam_round) 
    );
    CREATE INDEX IF NOT EXISTS idx_subjects_round ON subjects(exam_round);

    CREATE TABLE IF NOT EXISTS round_info (
        id TEXT PRIMARY KEY,
        label TEXT
    );
    `
	if _, err := d.db.Exec(schema); err != nil {
		log.Fatalf("❌ Error creating schema: %v", err)
	}

	// Enable WAL mode and other optimizations
	pragmas := []string{
		"PRAGMA journal_mode=WAL;",
		"PRAGMA synchronous=NORMAL;",
		"PRAGMA temp_store=MEMORY;",
		"PRAGMA busy_timeout=5000;",
	}
	for _, pragma := range pragmas {
		if _, err := d.db.Exec(pragma); err != nil {
			log.Printf("⚠️ Warning: Could not execute %q: %v", pragma, err)
		}
	}
}
