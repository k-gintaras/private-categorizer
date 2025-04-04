// server.js
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const cors = require('cors');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const filesRouter = require('./routes/files');
const likesRouter = require('./routes/likes');
const favoritesRouter = require('./routes/favorites');
const dislikesRouter = require('./routes/dislikes');
const analyticsRouter = require('./routes/analytics');
const tagsRouter = require('./routes/tags');
const colorsRouter = require('./routes/colors');

const app = express();

console.log('This is messages from server.js');
// console.log('Environment variables:', process.env);

// Modified part of server.js for database initialization
const ROOT_DIRECTORY = process.env.ROOT_DIRECTORY || './static';
// Use actual concatenation instead of template literals for FILE_DB_PATH
const FILE_DB_PATH = process.env.FILE_DB_PATH || path.join(ROOT_DIRECTORY, 'file_paths.db');
const PORT = process.env.MEDIA_SERVER_PORT || 3000;

console.log(`Root directory env: ${process.env.ROOT_DIRECTORY}`);
console.log(`Root directory: ${ROOT_DIRECTORY}`);
console.log(`Database path: ${FILE_DB_PATH}`);

// Check if ROOT_DIRECTORY exists
if (!fs.existsSync(ROOT_DIRECTORY)) {
  console.error(`Root directory not found: ${ROOT_DIRECTORY}`);
  process.exit(1);
}

// In server.js or wherever the database is initialized

// Check if database file exists
if (!fs.existsSync(FILE_DB_PATH)) {
  console.error(`Database file not found: ${FILE_DB_PATH}`);
  console.log('Would you like to create a new database? (y/n)');
  // Add code to prompt user and create database if needed
  // Or automatically initiate database creation:
  console.log(`Creating new database at ${FILE_DB_PATH}`);
  // Run the initialization code or script here
}
// Database initialization
let db;
try {
  db = new sqlite3.Database(FILE_DB_PATH, (err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      process.exit(1);
    }
    console.log('Connected to database successfully');
  });
} catch (err) {
  console.error('Failed to initialize database:', err);
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// serve static files actual files
app.use(
  '/static',
  (req, res, next) => {
    console.log('Serving static file:', req.path);
    next();
  },
  express.static(ROOT_DIRECTORY)
);

// Routes
app.use('/files', filesRouter(db));
app.use('/likes', likesRouter(db));
app.use('/favorites', favoritesRouter(db));
app.use('/dislikes', dislikesRouter(db));
app.use('/analytics', analyticsRouter(db));
app.use('/tags', tagsRouter(db));
app.use('/colors', colorsRouter(db));

// TODO: gettting colors crash the server

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
  console.log(`Server running at http://0.0.0.0:${PORT}`);
  console.log(`Files database: ${FILE_DB_PATH}`);
  console.log(`Root directory: ${ROOT_DIRECTORY}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing database connections...');
  db.close(() => {
    console.log('Database connections closed. Exiting...');
    process.exit(0);
  });
});
