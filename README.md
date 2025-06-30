# Media Server

## Quick Start

```bash
npm run setup    # Initial setup wizard
npm start        # Start both server and client
```

### Available Scripts

Setup & Health

```bash
npm run setup - Interactive setup wizard
npm run health - Check if everything is configured correctly
npm run fresh-install - Nuclear option: delete DB + node_modules
```

### Running

```bash
npm start - Start both server and client
npm run start-server - Server only
npm run start-client - Client only (Angular dev server)
```

### File Management

```bash
npm run index - Scan media files into database
npm run reindex - Force re-scan all files
```

### Docker

```bash
npm run docker - Build and start with Docker
npm run docker-dev - Start existing Docker containers
```

### Development

```bash
npm run deps - Install all dependencies
npm run build-client - Build Angular app for production
npm run git-reset - Hard reset to latest main (nuclear git option)
```

### Troubleshooting

```bash
npm run health - Check what's broken
npm run reindex - If files aren't showing up
npm run fresh-install - If everything is broken
```
