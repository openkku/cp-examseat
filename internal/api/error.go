package api

import (
	"encoding/json"
	"net/http"
)

type ErrorResponse struct {
	Error string `json:"error"`
}

// WriteError writes a JSON-formatted error response to the client.
func WriteError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(ErrorResponse{Error: message})
}

// WriteNoData writes a standard JSON 404 error response when no data is found.
func WriteNoData(w http.ResponseWriter, message string) {
	if message == "" {
		message = "No data found"
	}
	WriteError(w, message, http.StatusNotFound)
}
