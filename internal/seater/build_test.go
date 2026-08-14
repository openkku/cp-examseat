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

func TestParseLabels(t *testing.T) {
	tests := []struct {
		raw      string
		expected []string
	}{
		{"", nil},
		{"Lecture", []string{"Lecture"}},
		{"LAB, Lab, LAB", []string{"LAB", "Lab"}},
		{" นัดสอบนอกตาราง , Lecture ", []string{"นัดสอบนอกตาราง", "Lecture"}},
	}

	for _, tt := range tests {
		result := ParseLabels(tt.raw)
		if len(result) != len(tt.expected) {
			t.Errorf("ParseLabels(%q) expected %v, got %v", tt.raw, tt.expected, result)
			continue
		}
		for i := range result {
			if result[i] != tt.expected[i] {
				t.Errorf("ParseLabels(%q)[%d] expected %s, got %s", tt.raw, i, tt.expected[i], result[i])
			}
		}
	}
}

func TestNormalizeID(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"683380001-1", "6833800011"},
		{" 653380123-4 ", "6533801234"},
		{"", ""},
	}

	for _, tt := range tests {
		res := NormalizeID(tt.input)
		if res != tt.expected {
			t.Errorf("NormalizeID(%q) expected %q, got %q", tt.input, tt.expected, res)
		}
	}
}
