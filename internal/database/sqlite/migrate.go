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
        branch TEXT,
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

	// 1. Check if exams has branch column. If not, add it.
	var examsHasBranch bool
	rows, err := d.db.Query("PRAGMA table_info(exams);")
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var cid int
			var name, ctype string
			var notnull, pk int
			var dfltVal any
			if err := rows.Scan(&cid, &name, &ctype, &notnull, &dfltVal, &pk); err == nil {
				if name == "branch" {
					examsHasBranch = true
				}
			}
		}
	}
	if !examsHasBranch {
		log.Println("🔧 Adding branch column to exams table...")
		if _, err := d.db.Exec("ALTER TABLE exams ADD COLUMN branch TEXT;"); err != nil {
			log.Printf("⚠️ Warning: Could not add branch column to exams: %v", err)
		}
	}

	// 2. If students table exists, update exams.branch with students.branch, then drop students table
	var studentsExists bool
	rowsCheck, err := d.db.Query("SELECT name FROM sqlite_master WHERE type='table' AND name='students';")
	if err == nil {
		defer rowsCheck.Close()
		if rowsCheck.Next() {
			studentsExists = true
		}
	}
	if studentsExists {
		log.Println("📦 Migrating branch data from students table back to exams table...")
		_, err = d.db.Exec(`
			UPDATE exams 
			SET branch = (SELECT branch FROM students WHERE students.id = exams.student_id)
			WHERE branch IS NULL OR branch = '';
		`)
		if err != nil {
			log.Printf("⚠️ Warning: Could not copy branch data from students to exams: %v", err)
		}
		log.Println("🧹 Dropping students table...")
		if _, err := d.db.Exec("DROP TABLE IF EXISTS students;"); err != nil {
			log.Printf("⚠️ Warning: Could not drop students table: %v", err)
		}
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
