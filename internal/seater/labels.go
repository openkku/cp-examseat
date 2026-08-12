package seater

import "strings"

// ParseLabels splits a comma-separated string into a slice of clean label strings.
func ParseLabels(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	var labels []string
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			labels = append(labels, trimmed)
		}
	}
	return labels
}

// JoinLabels joins a slice of label strings into a single comma-separated string.
func JoinLabels(labels []string) string {
	var clean []string
	for _, l := range labels {
		trimmed := strings.TrimSpace(l)
		if trimmed != "" {
			clean = append(clean, trimmed)
		}
	}
	return strings.Join(clean, ",")
}
