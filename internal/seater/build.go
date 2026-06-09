package seater

import "regexp"

func NormalizeID(input string) string {
	reg := regexp.MustCompile("[^0-9]+")
	return reg.ReplaceAllString(input, "")
}
