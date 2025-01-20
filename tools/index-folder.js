const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Configurations
const ROOT_DIRECTORY = process.env.ROOT_DIRECTORY || './static'; // Root folder to scan
const DB_PATH = path.join(ROOT_DIRECTORY, 'file_paths.db'); // Database stored inside the root folder
const INIT_SQL_PATH = path.join(__dirname, '../init-db.sql'); // Schema initialization file

console.log(`Database will be initialized at: ${DB_PATH}`);

// Ensure the database folder exists
if (!fs.existsSync(ROOT_DIRECTORY)) {
  console.error(`Root directory does not exist: ${ROOT_DIRECTORY}`);
  process.exit(1);
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
    } else {
      console.log('Database schema initialized successfully.');
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

// Function to scan directories and index files
// const scanDirectory = (dir, parentId = null) => {
//   const entries = fs.readdirSync(dir, { withFileTypes: true });

//   entries.forEach((entry) => {
//     const fullPath = path.join(dir, entry.name);
//     const normalizedRoot = path.resolve(ROOT_DIRECTORY).replace(/\\/g, '/');
//     const normalizedFullPath = path.resolve(fullPath).replace(/\\/g, '/');
//     const relativePath = normalizedFullPath.replace(normalizedRoot, '');
//     const type = entry.isDirectory() ? 'directory' : 'file';
//     const subtype = type === 'file' ? getFileSubtype(fullPath) : null; // Only assign subtype to files

//     const stats = fs.statSync(fullPath);
//     const size = type === 'file' ? stats.size : null;
//     const lastModified = stats.mtime.toISOString();

//     // Insert file or directory into the database
//     db.run(`INSERT INTO files (path, type, parent_id, size, last_modified, subtype) VALUES (?, ?, ?, ?, ?, ?)`, [relativePath, type, parentId, size, lastModified, subtype], function (err) {
//       if (err) {
//         console.error(`Failed to insert ${relativePath}:`, err.message);
//       } else {
//         const newParentId = this.lastID; // Get the ID of the inserted entry

//         // Recurse if the entry is a directory
//         if (type === 'directory') {
//           scanDirectory(fullPath, newParentId);
//         }
//       }
//     });
//   });
// };
const scanDirectory = (dir, parentId = null) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    const normalizedRoot = path.resolve(ROOT_DIRECTORY).replace(/\\/g, '/');
    const normalizedFullPath = path.resolve(fullPath).replace(/\\/g, '/');
    const relativePath = normalizedFullPath.replace(normalizedRoot, '');
    const type = entry.isDirectory() ? 'directory' : 'file';
    const subtype = type === 'file' ? getFileSubtype(fullPath) : null; // Only assign subtype to files

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

// Main function
const initialize = () => {
  console.log('Setting up the database schema...');
  setupDatabaseSchema();

  console.log(`Scanning Root Directory: ${ROOT_DIRECTORY}`);
  scanDirectory(ROOT_DIRECTORY);

  db.close(() => {
    console.log('Database setup and indexing completed.');
  });
};

// Run the script
initialize();
