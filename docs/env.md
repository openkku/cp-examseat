# Environment Variables Reference

This document describes the environment variables supported by the `cpkku-view` application backend.

---

## 1. `DATA_DIR`

The directory path where all runtime dynamic configurations, sqlite database files, and local image assets are stored.

- **Default Value**: `data` (resolves relative to the server's working directory).
- **Purpose**: Decouples the application code (which is embedded inside the compiled binary) from user/school-specific runtime data. It also simplifies volume mapping inside Docker containers.

### Expected Directory Structure

When `DATA_DIR` is set (or falls back to `./data`), the application expects the following file structure inside it:

```
$DATA_DIR/
├── exams.db           # Private SQLite database containing student schedules
└── room/
    ├── metadata.json  # Catalog of room properties, blueprints, and reference photos
    ├── map/           # Seating map layout grids (JSON files)
    │   ├── CP9127.json
    │   └── SC1101.json
    └── image/         # Static layout drawings & photos (served locally if IMAGE_BASE_URL is unset)
        ├── CP.9127.jpg
        └── SC.1101.jpg
```

---

## 2. `IMAGE_BASE_URL`

The base URL prefix for layout blueprints and photos when serving them from an external CDN or static asset storage (e.g., Cloudflare R2, AWS S3, or Google Cloud Storage) instead of the Go application server.

- **Default Value**: Empty (unset).
- **Purpose**: Offloads heavy static image downloads from the Go backend directly to your CDN.

### Routing Behavior:

- **When Unset (Local serving)**: The server returns relative URL paths (e.g. `/room/image/CP.9127.jpg`) in the API responses. The client requests the image from the Go server, which serves it from `$DATA_DIR/room/image/CP.9127.jpg`.
- **When Set (CDN / External serving)**: The server prepends `IMAGE_BASE_URL` to all layout image and reference photo URLs returned by the API (e.g. `https://cdn.example.com/room/image/CP.9127.jpg`). The client requests the image directly from the CDN.

---

## Quick Configuration Examples

### Local Development (Default)
Simply run the app without any environment variables. It will automatically load database and configuration files relative to `./data/`:
```bash
go run main.go
```

### Local Development with Custom Data Directory
If you want to configure layouts in a separate local directory (e.g. a separate checkout of your private layouts repository):
```bash
export DATA_DIR="../my-layouts-repo"
go run main.go
```

### Production with CDN Offloading
Deploy your server in a Docker container mounting the data folder, and configure it to point to your CDN storage:
```bash
docker run -d \
  -p 8080:8080 \
  -v ./my-local-data:/app/data \
  -e IMAGE_BASE_URL="https://cdn.yourdomain.com" \
  cpkku-view:latest
```
