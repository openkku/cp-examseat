package sqlite

import (
	"log"
)

func (d *Database) migrate() {
	d.db.Exec("PRAGMA foreign_keys = ON;")

	// Drop legacy flat exams table if it exists
	d.db.Exec("DROP TABLE IF EXISTS exams;")

	// Check if exam_sessions has 'date' column. If not (old date_start schema), drop tables to recreate cleanly.
	var hasDateCol bool
	rows, err := d.db.Query("PRAGMA table_info(exam_sessions);")
	if err == nil {
		for rows.Next() {
			var cid int
			var name, ctype string
			var notnull, pk int
			var dfltVal any
			if err := rows.Scan(&cid, &name, &ctype, &notnull, &dfltVal, &pk); err == nil {
				if name == "date" {
					hasDateCol = true
				}
			}
		}
		rows.Close()
		if !hasDateCol {
			d.db.Exec("DROP TABLE IF EXISTS exam_seats;")
			d.db.Exec("DROP TABLE IF EXISTS session_labels;")
			d.db.Exec("DROP TABLE IF EXISTS exam_sessions;")
		}
	}

	schema := `
    CREATE TABLE IF NOT EXISTS round_info (
        id TEXT PRIMARY KEY,
        label TEXT
    );

    CREATE TABLE IF NOT EXISTS subjects (
        id TEXT,
        exam_round TEXT,
        name TEXT,
        PRIMARY KEY (id, exam_round)
    );
    CREATE INDEX IF NOT EXISTS idx_subjects_round ON subjects(exam_round);

    CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        branch TEXT
    );

    CREATE TABLE IF NOT EXISTS exam_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exam_round TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'IN_SCHEDULE',
        custom_id TEXT DEFAULT '',
        sheet TEXT NOT NULL,
        date TEXT NOT NULL,
        time_start TEXT NOT NULL,
        time_end TEXT,
        room TEXT NOT NULL,
        subject_id TEXT NOT NULL,
        section TEXT NOT NULL,
        note TEXT DEFAULT '',
        room_layout TEXT DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_lookup ON exam_sessions(exam_round, room, date, time_start);
    CREATE INDEX IF NOT EXISTS idx_sessions_category ON exam_sessions(exam_round, category);
    CREATE INDEX IF NOT EXISTS idx_sessions_custom ON exam_sessions(exam_round, custom_id);

    CREATE TABLE IF NOT EXISTS session_labels (
        session_id INTEGER NOT NULL,
        label TEXT NOT NULL,
        PRIMARY KEY (session_id, label),
        FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_session_labels_label ON session_labels(label);

    CREATE TABLE IF NOT EXISTS exam_seats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        student_id TEXT NOT NULL,
        seat TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id)
    );
    CREATE INDEX IF NOT EXISTS idx_seats_student ON exam_seats(student_id);
    CREATE INDEX IF NOT EXISTS idx_seats_session ON exam_seats(session_id);
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
