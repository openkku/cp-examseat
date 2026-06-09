package explore

import (
	"time"

	"github.com/maypok86/otter/v2"
)

var ExploreCache = otter.Must(&otter.Options[string, []byte]{
	MaximumSize:      10_000,
	ExpiryCalculator: otter.ExpiryAccessing[string, []byte](5 * time.Minute),
})
