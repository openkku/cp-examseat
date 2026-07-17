package seater

import (
	"regexp"
	"strconv"
	"strings"
)

func NormalizeID(input string) string {
	reg := regexp.MustCompile("[^0-9]+")
	return reg.ReplaceAllString(input, "")
}

// parseRoundID parses a round ID string into year, semester, and a type weight
func parseRoundID(id string) (year int, semester int, typeWeight int) {
	parts := strings.Split(id, "_")
	if len(parts) != 3 {
		return 0, 0, 0
	}

	// parse year (parts[2])
	if y, err := strconv.Atoi(parts[2]); err == nil {
		year = y
	}

	// parse semester (parts[1])
	if sem, err := strconv.Atoi(parts[1]); err == nil {
		semester = sem
	}

	// type weight: final = 2, mid = 1, others = 0
	if parts[0] == "final" {
		typeWeight = 2
	} else if parts[0] == "mid" {
		typeWeight = 1
	}

	return
}

// CompareRounds returns true if idA should come before idB in descending chronological order
func CompareRounds(idA, idB string) bool {
	yearA, semA, typeA := parseRoundID(idA)
	yearB, semB, typeB := parseRoundID(idB)

	if yearA != yearB {
		return yearA > yearB
	}
	if semA != semB {
		return semA > semB
	}
	if typeA != typeB {
		return typeA > typeB
	}
	return idA > idB
}
