package api

import (
	"cpkkuview/internal/compress"
	"cpkkuview/internal/room"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
)

func HandleGetRoom(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Parse "room" query params (supports ?room=A&room=B and ?room=A,B)
	queryValues := r.URL.Query()["room"]
	NoLayout := r.URL.Query().Get("no_layout") == "true"
	var requestedRooms []string

	cacheKey := fmt.Sprintf("room:%t", NoLayout)

	for _, q := range queryValues {
		// Split by comma in case user sent ?room=A,B
		parts := strings.Split(q, ",")
		for _, p := range parts {
			trimmed := strings.TrimSpace(p)
			if trimmed != "" {
				requestedRooms = append(requestedRooms, trimmed)
				cacheKey += fmt.Sprintf(":%s", trimmed)
			}
		}
	}

	if len(requestedRooms) > len(room.RoomLayouts) {
		WriteError(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	encoding := compress.GetEncoding(r)
	cacheKey += ":" + encoding

	// Fetch from Cache
	cachedBytes, ok := room.RoomResponseCache.GetIfPresent(cacheKey)
	if !ok {
		// initialize response array
		responseMap := make(map[string]map[string]interface{})

		// Case A: No specific rooms requested -> Return EVERYTHING
		if len(requestedRooms) == 0 {
			if NoLayout {
				responseMap = room.RoomCacheNoLayout
			} else {
				responseMap = room.RoomCache
			}
			goto response
		}

		// Case B: Filter specific rooms
		// We build a subset map to return only what was asked for

		for _, roomID := range requestedRooms {
			if NoLayout {
				if data, exists := room.RoomCacheNoLayout[roomID]; exists {
					responseMap[roomID] = data
				}
			} else {
				if data, exists := room.RoomCache[roomID]; exists {
					responseMap[roomID] = data
				}
			}
		}

	response:
		if len(responseMap) == 0 {
			WriteNoData(w, "Rooms not found")
			return
		}

		jsonBytes, err := json.Marshal(responseMap)
		if err != nil {
			log.Printf("JSON Marshal Error: %v", err)
			WriteError(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		compressedBytes, err := compress.CompressBytes(jsonBytes, encoding)
		if err != nil {
			log.Printf("Compression Error: %v", err)
			WriteError(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		cachedBytes = compressedBytes
		room.RoomResponseCache.Set(cacheKey, cachedBytes)
	}

	// Serve to the client
	w.Header().Set("Content-Type", "application/json")
	if encoding != "" {
		w.Header().Set("Content-Encoding", encoding)
	}
	w.Write(cachedBytes)
}
