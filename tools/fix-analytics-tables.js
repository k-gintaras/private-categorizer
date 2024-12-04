const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const FILE_DB_PATH = process.env.FILE_DB_PATH || './file_paths.db';

const createMegaTableSQL = `
-- Drop the existing analytics table if it exists
DROP TABLE IF EXISTS analytics;
DROP TABLE IF EXISTS video_analytics;
DROP TABLE IF EXISTS image_analytics;
DROP TABLE IF EXISTS audio_analytics;
DROP TABLE IF EXISTS text_analytics;

-- Create the mega table
CREATE TABLE analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL, -- Foreign key to files table
    file_type TEXT NOT NULL, -- 'video', 'audio', 'image', 'text'
    last_viewed TIMESTAMP DEFAULT NULL, -- Common to all types
    total_watch_time INTEGER DEFAULT 0, -- Common to all types
    view_count INTEGER DEFAULT 0, -- Common to all types
    skips TEXT DEFAULT NULL, -- JSON array for video/audio skips
    scroll_up_count INTEGER DEFAULT NULL, -- For image/text
    scroll_down_count INTEGER DEFAULT NULL, -- For image/text
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
);
`;

const db = new sqlite3.Database(FILE_DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the database for creating the analytics table');
});

// Execute the SQL to create the table
db.exec(createMegaTableSQL, (err) => {
  if (err) {
    console.error('Error creating the analytics table:', err.message);
    process.exit(1);
  }
  console.log('Analytics table created successfully');
});

// Close the database connection
db.close(() => {
  console.log('Database connection closed');
});
