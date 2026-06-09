package calendar

import (
	"time"

	"github.com/maypok86/otter/v2"
)

// CalendarCache is the in-memory cache for calendar feed outputs, retaining items for 10 minutes since last access.
var CalendarCache = otter.Must(&otter.Options[string, []byte]{
	MaximumSize:      5000,
	ExpiryCalculator: otter.ExpiryAccessing[string, []byte](10 * time.Minute),
})
