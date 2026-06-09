package sqlite

import (
	"cpkkuview/internal/database"
	"database/sql"
	"sync"
)

type Database struct {
	db    *sql.DB
	cache sync.Map
}

var (
	_ database.Database = (*Database)(nil)
)
