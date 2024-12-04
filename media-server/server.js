// server.js
const path = require('path');
const cors = require('cors');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const filesRouter = require('./routes/files');
const likesRouter = require('./routes/likes');
const analyticsRouter = require('./routes/analytics');
const tagsRouter = require('./routes/tags');
const colorsRouter = require('./routes/colors');

const app = express();
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const ROOT_DIRECTORY = process.env.ROOT_DIRECTORY || './static';
const FILE_DB_PATH = process.env.FILE_DB_PATH || './file_ids.db';
const PORT = process.env.MEDIA_SERVER_PORT || 3000;

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
app.use('/analytics', analyticsRouter(db));
app.use('/tags', tagsRouter(db));
app.use('/colors', colorsRouter(db));

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
