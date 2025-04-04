const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Check for force reindex flag
const args = process.argv.slice(2);
const forceReindex = args.includes('--force');

// Configurations
const ROOT_DIRECTORY = process.env.ROOT_DIRECTORY || './static'; // Root folder to scan
const DB_PATH = process.env.FILE_DB_PATH || path.join(ROOT_DIRECTORY, 'file_paths.db'); // Use env or default
const INIT_SQL_PATH = path.join(__dirname, '../init-db.sql'); // Schema initialization file

console.log(`Database path: ${DB_PATH}`);
console.log(`Root directory: ${ROOT_DIRECTORY}`);

// Check if the database already exists
const dbExists = fs.existsSync(DB_PATH);

// Ensure the root directory exists
if (!fs.existsSync(ROOT_DIRECTORY)) {
  console.error(`Root directory does not exist: ${ROOT_DIRECTORY}`);
  process.exit(1);
}

// Ensure the database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  console.log(`Creating database directory: ${dbDir}`);
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize SQLite Database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database');
});

// Function to initialize the database schema
const setupDatabaseSchema = () => {
  if (!fs.existsSync(INIT_SQL_PATH)) {
    console.error(`SQL file not found: ${INIT_SQL_PATH}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(INIT_SQL_PATH, 'utf-8');
  db.exec(sql, (err) => {
    if (err) {
      console.error('Failed to execute database schema:', err.message);
      process.exit(1);
    } else {
      console.log('Database schema initialized successfully.');

      // Decide whether to run indexing
      if (!dbExists || forceReindex) {
        console.log(`${forceReindex ? 'Forced re-indexing' : 'New database created'}. Starting indexing...`);
        scanDirectory(ROOT_DIRECTORY);
      } else {
        console.log('Database already exists. Skipping indexing.');
        db.close(() => {
          console.log('Database connection closed.');
        });
      }
    }
  });
};

// Define file extensions for each category (added more subtypes)
const videoExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.wmv'];
const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg'];
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'];
const textExtensions = ['.txt', '.md', '.pdf', '.docx', '.rtf'];
const archiveExtensions = ['.zip', '.tar', '.rar', '.7z', '.gz'];
const spreadsheetExtensions = ['.xls', '.xlsx', '.csv'];
const presentationExtensions = ['.ppt', '.pptx'];
const codeExtensions = ['.js', '.ts', '.py', '.java', '.cpp', '.html', '.css', '.json'];
const databaseExtensions = ['.db', '.sqlite', '.mdb'];
const fontExtensions = ['.ttf', '.otf', '.woff', '.woff2'];

// Function to get the file subtype based on the extension
function getFileSubtype(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (videoExtensions.includes(ext)) {
    return 'video';
  } else if (audioExtensions.includes(ext)) {
    return 'audio';
  } else if (imageExtensions.includes(ext)) {
    return 'image';
  } else if (textExtensions.includes(ext)) {
    return 'text';
  } else if (archiveExtensions.includes(ext)) {
    return 'archive';
  } else if (spreadsheetExtensions.includes(ext)) {
    return 'spreadsheet';
  } else if (presentationExtensions.includes(ext)) {
    return 'presentation';
  } else if (codeExtensions.includes(ext)) {
    return 'code';
  } else if (databaseExtensions.includes(ext)) {
    return 'database';
  } else if (fontExtensions.includes(ext)) {
    return 'font';
  } else {
    return 'unknown'; // If no match, categorize as 'unknown'
  }
}

// Scan directory function (unchanged from your code)
const scanDirectory = (dir, parentId = null) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    const normalizedRoot = path.resolve(ROOT_DIRECTORY).replace(/\\/g, '/');
    const normalizedFullPath = path.resolve(fullPath).replace(/\\/g, '/');
    const relativePath = normalizedFullPath.replace(normalizedRoot, '');
    const type = entry.isDirectory() ? 'directory' : 'file';
    const subtype = type === 'file' ? getFileSubtype(fullPath) : 'unknown'; // Only assign subtype to files

    const stats = fs.statSync(fullPath);
    const size = type === 'file' ? stats.size : null;
    const lastModified = stats.mtime.toISOString();

    // Check if the path already exists in the database
    db.get(`SELECT id FROM files WHERE path = ?`, [relativePath], (err, row) => {
      if (err) {
        console.error(`Database error for ${relativePath}:`, err.message);
      } else if (row) {
        console.log(`Path already exists, continuing scan: ${relativePath}`);
        if (type === 'directory') {
          // Continue scanning the directory using the existing ID
          scanDirectory(fullPath, row.id);
        }
      } else {
        // Insert the new file or directory
        db.run(`INSERT INTO files (path, type, parent_id, size, last_modified, subtype) VALUES (?, ?, ?, ?, ?, ?)`, [relativePath, type, parentId, size, lastModified, subtype], function (err) {
          if (err) {
            console.error(`Failed to insert ${relativePath}:`, err.message);
          } else {
            const newParentId = this.lastID; // Get the ID of the inserted entry

            // Recurse if the entry is a directory
            if (type === 'directory') {
              scanDirectory(fullPath, newParentId);
            }
          }
        });
      }
    });
  });
};

// Start the process
setupDatabaseSchema();
