package room

import (
	"time"

	"github.com/maypok86/otter/v2"
)

var RoomLayouts = make(map[string]string)
var RoomLayoutImages = make(map[string]string)
var RoomMap = make(map[string]string)
var RoomImages = make(map[string][]string)

type RoomMeta struct {
	LayoutFile  string   `json:"layout_file"`
	LayoutImage string   `json:"layout_image"`
	MapURL      string   `json:"map_url"`
	Images      []string `json:"images"`
}

var RoomCache = make(map[string]map[string]interface{})
var RoomCacheNoLayout = make(map[string]map[string]interface{})

var RoomResponseCache = otter.Must(&otter.Options[string, []byte]{
	MaximumSize:      10_000,
	ExpiryCalculator: otter.ExpiryAccessing[string, []byte](5 * time.Minute),
})
