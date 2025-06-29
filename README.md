# Media Server Setup Guide

## Quick Start (Recommended)

For new installations, use the quick setup wizard:

```bash
npm run quick-setup
```

This will guide you through:

- ✅ Configuring media directory paths
- ✅ Setting up network access
- ✅ Installing dependencies
- ✅ Indexing your media files
- ✅ Running health checks

## Manual Setup

If you prefer manual configuration:

### 1. Configure Environment

```bash
# Copy and edit the environment file
cp .env3 .env
# Edit .env with your settings
```

### 2. Setup and Health Check

```bash
npm run setup-env        # Generate config files
npm run health-check     # Validate configuration
```

### 3. Install Dependencies

```bash
npm run setup-all        # Install all dependencies
```

### 4. Index Media Files

```bash
npm run index-files      # First time indexing
npm run reindex          # Force re-index
```

## Starting the Server

```bash
npm start                # Start both server and client
npm run start-server     # Server only
npm run start-client     # Client only
npm run start-force      # Force reindex and start
```

## Health Checks and Diagnostics

```bash
npm run health-check     # Check system health
npm run validate         # Same as health-check
npm run diagnose         # Health check with tips
```

## What the Health Check Validates

### Environment Configuration

- ✅ `.env` file exists and is properly formatted
- ✅ All required environment variables are set
- ✅ No default values that should be customized
- ✅ Network configuration is consistent

### Directory Structure

- ✅ Media directory exists and is accessible
- ✅ Database directory is readable/writable
- ✅ Paths are properly configured

### Database Health

- ✅ Database file exists and is accessible
- ✅ All required tables are present
- ✅ Database schema is up to date

### File Indexing

- ✅ Media files are indexed in database
- ✅ Index is recent (warns if > 7 days old)
- ✅ File count matches expectations

### Network Configuration

- ✅ Server URL matches host and port settings
- ✅ Port is valid and available
- ✅ Network access is properly configured

## Common Issues and Solutions

### "No files found in database"

```bash
npm run index-files      # Index your media files
```

### "Directory not found"

- Check your `.env` file paths
- Ensure directories exist
- Run `npm run quick-setup` to reconfigure

### "Database connection failed"

```bash
npm run index-files      # Recreate database
```

### "Port already in use"

- Change `MEDIA_SERVER_PORT` in `.env`
- Or stop the conflicting service

### "Default values detected"

- Run `npm run quick-setup` to customize configuration
- Manually edit `.env` file with your specific paths

## Development vs Production

### Development (Local Only)

```bash
SERVER_HOST=localhost
SERVER_URL=http://localhost:4001
```

### Network Access (LAN)

```bash
SERVER_HOST=192.168.1.174    # Your machine's IP
SERVER_URL=http://192.168.1.174:4001
```

## Docker Deployment

```bash
npm run docker-full      # Build and start with Docker
npm run docker-build     # Build only
npm run docker-up        # Start existing containers
```

## Configuration Files

- `.env` - Main configuration
- `media-viewer/src/environments/environment.ts` - Angular config (auto-generated)
- `docker-compose.yml` - Docker configuration (auto-generated)

## Health Check API

When server is running, check health at:

```
GET http://localhost:4001/health
```

Returns JSON with health status and detailed check results.

## Troubleshooting

1. **Run health check first**: `npm run health-check`
2. **Check logs**: Look for specific error messages
3. **Validate paths**: Ensure all directories exist
4. **Reset configuration**: Run `npm run quick-setup` again
5. **Force reindex**: `npm run reindex`

## Support

If you encounter issues:

1. Run `npm run diagnose` for detailed information
2. Check the health check output for specific errors
3. Ensure all file paths in `.env` are correct for your system
4. Verify network settings if accessing from other devices
