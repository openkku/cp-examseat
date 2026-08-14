package seater

import "strings"

// ParseLabels splits a comma-separated string into a slice of clean, unique label strings.
func ParseLabels(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	labels := make([]string, 0, len(parts))
	seen := make(map[string]bool, len(parts))
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" && !seen[trimmed] {
			seen[trimmed] = true
			labels = append(labels, trimmed)
		}
	}
	return labels
}

// JoinLabels joins a slice of label strings into a single comma-separated string after deduplication.
func JoinLabels(labels []string) string {
	clean := make([]string, 0, len(labels))
	seen := make(map[string]bool, len(labels))
	for _, l := range labels {
		trimmed := strings.TrimSpace(l)
		if trimmed != "" && !seen[trimmed] {
			seen[trimmed] = true
			clean = append(clean, trimmed)
		}
	}
	return strings.Join(clean, ",")
}
