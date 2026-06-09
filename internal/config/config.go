package config

import "os"

// GetDataDir returns the database and assets directory path from the environment.
// Defaults to "data" if not set.
func GetDataDir() string {
	dir := os.Getenv("DATA_DIR")
	if dir == "" {
		return "data"
	}
	return dir
}
