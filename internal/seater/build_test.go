package seater

import (
	"sort"
	"testing"
)

func TestCompareRounds(t *testing.T) {
	rounds := []string{
		"final_1_2567",
		"mid_1_2569",
		"mid_2_2568",
		"final_2_2568",
		"final_1_2568",
	}

	expected := []string{
		"mid_1_2569",
		"final_2_2568",
		"mid_2_2568",
		"final_1_2568",
		"final_1_2567",
	}

	sort.Slice(rounds, func(i, j int) bool {
		return CompareRounds(rounds[i], rounds[j])
	})

	for i, r := range rounds {
		if r != expected[i] {
			t.Errorf("At index %d: expected %s, got %s", i, expected[i], r)
		}
	}
}
