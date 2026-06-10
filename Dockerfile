# ----------------------------
# Stage 1: Build Frontend
# ----------------------------
FROM node:22-alpine AS ui-builder

WORKDIR /app/frontend

# Copy frontend dependency files
COPY frontend/package.json frontend/package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the frontend source code
COPY frontend/ .

# Build the React app (Output goes to /app/frontend/dist)
RUN npm run build

# ----------------------------
# Stage 2: Build Backend (Go)
# ----------------------------
FROM golang:alpine AS backend-builder

WORKDIR /app

# Install build tools if necessary (e.g. for CGO)
# RUN apk add --no-cache gcc musl-dev

# Copy Go dependency files
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the Go source code
COPY . .

# Copy the React build artifacts so Go can embed them during compilation
COPY --from=ui-builder /app/frontend/dist ./frontend/dist

# Pre-compress the static assets using Go
RUN go run cmd/precompress/main.go

# Build the Go binary named 'server'
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

# ----------------------------
# Stage 3: Final Production Image
# ----------------------------
FROM alpine:latest

WORKDIR /app

# Install certificates for external API calls
RUN apk --no-cache add ca-certificates

# Set the default data directory inside the container
ENV DATA_DIR=/app/data

# Copy the Go binary
COPY --from=backend-builder /app/server .

# Expose the port your Go app runs on
EXPOSE 8080

# Run the binary
CMD ["./server"]