package room

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"strings"
)

func Init(configPath string) {
	// 1. Read metadata.json
	metaPath := filepath.Join(configPath, "metadata.json")
	metaContent, err := os.ReadFile(metaPath)
	if err != nil {
		log.Printf("⚠️ Warning: Could not read room metadata at %s: %v. Starting with empty layouts.", metaPath, err)
		return
	}

	var metadata map[string]RoomMeta
	if err := json.Unmarshal(metaContent, &metadata); err != nil {
		log.Printf("❌ Error: Could not parse room metadata at %s: %v. Starting with empty layouts.", metaPath, err)
		return
	}

	// 2. Fetch the base URL from the environment
	imageBaseURL := strings.TrimSuffix(os.Getenv("IMAGE_BASE_URL"), "/")

	// Helper function to dynamically prefix the URL
	prefixURL := func(urlPath string) string {
		if imageBaseURL != "" && strings.HasPrefix(urlPath, "/") {
			return imageBaseURL + "/" + strings.TrimPrefix(urlPath, "/")
		}
		return urlPath
	}

	// 3. Populate the dynamic structures
	for roomName, meta := range metadata {
		RoomLayouts[roomName] = meta.LayoutFile
		RoomLayoutImages[roomName] = prefixURL(meta.LayoutImage)
		RoomMap[roomName] = meta.MapURL
		
		prefixedImages := []string{}
		for _, img := range meta.Images {
			prefixedImages = append(prefixedImages, prefixURL(img))
		}
		RoomImages[roomName] = prefixedImages
	}

	mapDir := filepath.Join(configPath, "map")
	loadedCount := 0

	for apiName, fileName := range RoomLayouts {
		filePath := filepath.Join(mapDir, fileName)

		// Read file from disk
		content, err := os.ReadFile(filePath)
		if err != nil {
			// Log warning but don't crash; just skip this room
			log.Printf("⚠️  Warning: Room '%s' mapped to '%s' but file is missing/unreadable.", apiName, fileName)
			continue
		}
		var roomLayout map[string]interface{}
		if err := json.Unmarshal(content, &roomLayout); err != nil {
			log.Printf("❌ Error parsing JSON for %s: %v", apiName, err)
			continue
		}

		roomData := make(map[string]interface{})
		roomData["i_layout"] = RoomLayoutImages[apiName]
		roomData["i_map"] = RoomMap[apiName]

		if images, ok := RoomImages[apiName]; ok {
			roomData["i_images"] = images
		} else {
			roomData["i_images"] = []string{}
		}

		// Cache Without Layout
		RoomCacheNoLayout[apiName] = roomData

		// init Cache With Layout, copying all data from roomData
		roomWithLayout := make(map[string]interface{}, len(roomData)+1)
		for k, v := range roomData {
			roomWithLayout[k] = v
		}

		roomWithLayout["layout"] = roomLayout["layout"]
		if fl, ok := roomLayout["frontLabel"]; ok {
			roomWithLayout["frontLabel"] = fl
		}
		if bl, ok := roomLayout["backLabel"]; ok {
			roomWithLayout["backLabel"] = bl
		}
		RoomCache[apiName] = roomWithLayout

		loadedCount++
	}
	log.Printf("✅ Loaded %d room layouts into memory.", loadedCount)
}
