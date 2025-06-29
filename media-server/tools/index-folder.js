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
const INIT_INSERTS_PATH = path.join(__dirname, '../initial-inserts.sql'); // Data initialization file

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

// Function to run initial data inserts
const runInitialInserts = () => {
  if (!fs.existsSync(INIT_INSERTS_PATH)) {
    console.log('No initial inserts file found, skipping data initialization');
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const insertSql = fs.readFileSync(INIT_INSERTS_PATH, 'utf-8');

    console.log('Running initial data inserts...');
    db.exec(insertSql, (err) => {
      if (err) {
        console.error('Failed to execute initial inserts:', err.message);
        reject(err);
      } else {
        console.log('Initial data inserts completed successfully');
        resolve();
      }
    });
  });
};

// Function to initialize the database schema
const setupDatabaseSchema = async () => {
  if (!fs.existsSync(INIT_SQL_PATH)) {
    console.error(`SQL file not found: ${INIT_SQL_PATH}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(INIT_SQL_PATH, 'utf-8');

  return new Promise((resolve, reject) => {
    db.exec(sql, async (err) => {
      if (err) {
        console.error('Failed to execute database schema:', err.message);
        reject(err);
      } else {
        console.log('Database schema initialized successfully.');

        // Run initial inserts if this is a new database
        if (!dbExists) {
          try {
            await runInitialInserts();
          } catch (insertErr) {
            console.error('Initial inserts failed:', insertErr.message);
            // Continue anyway - inserts are not critical
          }
        }

        // Decide whether to run indexing
        if (!dbExists || forceReindex) {
          console.log(`${forceReindex ? 'Forced re-indexing' : 'New database created'}. Starting file indexing...`);
          scanDirectory(ROOT_DIRECTORY);
        } else {
          console.log('Database already exists. Skipping indexing.');
          db.close(() => {
            console.log('Database connection closed.');
          });
        }

        resolve();
      }
    });
  });
};

// Function to check if initial data already exists
const checkInitialDataExists = () => {
  return new Promise((resolve) => {
    db.get('SELECT COUNT(*) as count FROM tags', (err, row) => {
      if (err) {
        console.log('Could not check for existing data, assuming none exists');
        resolve(false);
      } else {
        const hasData = row.count > 0;
        console.log(`Found ${row.count} existing tags in database`);
        resolve(hasData);
      }
    });
  });
};

// Enhanced initial inserts with data check
const runInitialInsertsIfNeeded = async () => {
  if (!fs.existsSync(INIT_INSERTS_PATH)) {
    console.log('No initial inserts file found, skipping data initialization');
    return;
  }

  // Check if we already have initial data
  const hasData = await checkInitialDataExists();
  if (hasData) {
    console.log('Initial data already exists, skipping inserts');
    return;
  }

  return new Promise((resolve, reject) => {
    const insertSql = fs.readFileSync(INIT_INSERTS_PATH, 'utf-8');

    console.log('Running initial data inserts...');
    db.exec(insertSql, (err) => {
      if (err) {
        console.error('Failed to execute initial inserts:', err.message);
        reject(err);
      } else {
        console.log('✅ Initial data inserts completed successfully');
        resolve();
      }
    });
  });
};

// Define file extensions for each category - simplified to your 4 core types
const videoExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.webm', '.flv'];
const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'];
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.webp'];
const textExtensions = ['.txt', '.md', '.pdf', '.docx', '.rtf', '.html', '.json', '.csv'];

// Simplified function to get the file subtype (only 4 types)
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
  } else {
    return 'text'; // Default fallback to text for unknown extensions
  }
}

// Scan directory function
const scanDirectory = (dir, parentId = null) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    const normalizedRoot = path.resolve(ROOT_DIRECTORY).replace(/\\/g, '/');
    const normalizedFullPath = path.resolve(fullPath).replace(/\\/g, '/');
    const relativePath = normalizedFullPath.replace(normalizedRoot, '');
    const type = entry.isDirectory() ? 'directory' : 'file';
    const subtype = type === 'file' ? getFileSubtype(fullPath) : 'text'; // Default for directories

    const stats = fs.statSync(fullPath);
    const size = type === 'file' ? stats.size : null;
    const lastModified = stats.mtime.toISOString();

    // Check if the path already exists in the database
    db.get(`SELECT id FROM files WHERE path = ?`, [relativePath], (err, row) => {
      if (err) {
        console.error(`Database error for ${relativePath}:`, err.message);
      } else if (row) {
        // console.log(`Path already exists: ${relativePath}`);
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
            console.log(`✅ Indexed: ${relativePath} (${subtype})`);
            const newParentId = this.lastID;

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

// Updated main function with better error handling
const main = async () => {
  try {
    await setupDatabaseSchema();

    // Run initial inserts for new databases
    if (!dbExists) {
      await runInitialInsertsIfNeeded();
    }
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
};

// Start the process
main();
