package api

import (
	"cpkkuview/internal/round"
	"encoding/json"
	"net/http"
)

func HandleGetRound(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(round.RoundMap)
}
