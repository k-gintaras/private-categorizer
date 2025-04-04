const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const FILE_DB_PATH = process.env.FILE_DB_PATH || './file_paths.db';

// Initialize database connection
const db = new sqlite3.Database(FILE_DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  }
  console.log('Connected to the database for migrations');
});

// Execute SQL commands to update the database schema
const runMigrations = () => {
  const migrations = [
    // Add a "likes" table if it doesn't exist
    `CREATE TABLE IF NOT EXISTS dislikes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL, -- Links to the files table
        timestamp INTEGER NOT NULL, -- Time (in seconds) of the like within the media
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When the like was added
        FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL UNIQUE, -- Links to the files table, ensures one favorite per file
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When the favorite was added
        FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
    );`,
  ];

  migrations.forEach((query, index) => {
    db.run(query, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error(`Migration ${index + 1} failed:`, err);
      } else {
        console.log(`Migration ${index + 1} applied successfully`);
      }
    });
  });
};

// Run migrations and close the database
runMigrations();

db.close(() => {
  console.log('Database migrations completed and connection closed.');
});
