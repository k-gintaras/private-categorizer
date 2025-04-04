const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const FILE_DB_PATH = process.env.FILE_DB_PATH || './file_paths.db';

// Open the database
const db = new sqlite3.Database(FILE_DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database');
});

// Define file extensions for each category (expanded types)
const videoExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.wmv'];
const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg'];
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'];
const textExtensions = ['.txt', '.md', '.pdf', '.docx', '.rtf'];
const archiveExtensions = ['.zip', '.tar', '.rar', '.7z', '.gz'];
const spreadsheetExtensions = ['.xls', '.xlsx', '.csv'];
const presentationExtensions = ['.ppt', '.pptx'];
const codeExtensions = ['.js', '.ts', '.py', '.java', '.cpp', '.html', '.css', '.json'];

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
  } else {
    return 'unknown'; // If no match, categorize as 'unknown'
  }
}

// Function to update file subtypes in the database
function updateFileSubtypes() {
  // Alter table to add 'subtype' column if it doesn't exist
  db.run('ALTER TABLE files ADD COLUMN subtype TEXT;', (err) => {
    if (err && !err.message.includes('duplicate column')) {
      // Ignore if the column already exists
      console.error('Error adding subtype column:', err.message);
      process.exit(1);
    }
    console.log('Subtype column added or already exists.');
  });

  db.all('SELECT id, path FROM files', [], (err, rows) => {
    if (err) {
      console.error('Error fetching files:', err);
      process.exit(1);
    }

    rows.forEach((file) => {
      const fileSubtype = getFileSubtype(file.path);

      // Update the file subtype in the database
      db.run('UPDATE files SET subtype = ? WHERE id = ?', [fileSubtype, file.id], (err) => {
        if (err) {
          console.error(`Error updating subtype for file ${file.path}:`, err);
        } else {
          console.log(`Updated subtype for file ${file.path}: ${fileSubtype}`);
        }
      });
    });

    // Close the database connection after the updates are done
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  });
}

// Run the update function
updateFileSubtypes();
