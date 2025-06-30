const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const { indexSingleItem } = require('./index-file');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Check for force reindex flag
const args = process.argv.slice(2);
const forceReindex = args.includes('--force');

// Configurations
const ROOT_DIRECTORY = process.env.ROOT_DIRECTORY || './static';
const DB_PATH = process.env.FILE_DB_PATH || path.join(ROOT_DIRECTORY, 'file_paths.db');
const INIT_SQL_PATH = path.join(__dirname, '../init-db.sql');
const INIT_INSERTS_PATH = path.join(__dirname, '../initial-inserts.sql');

console.log(`📁 Root directory: ${ROOT_DIRECTORY}`);
console.log(`🗃️  Database: ${DB_PATH}`);

// Check if database exists
const dbExists = fs.existsSync(DB_PATH);

// Validate paths
if (!fs.existsSync(ROOT_DIRECTORY)) {
  console.error(`❌ Root directory not found: ${ROOT_DIRECTORY}`);
  process.exit(1);
}

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  console.log(`📁 Creating database directory: ${dbDir}`);
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Setup database schema
async function setupDatabase() {
  if (!fs.existsSync(INIT_SQL_PATH)) {
    console.error(`❌ Schema file not found: ${INIT_SQL_PATH}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(INIT_SQL_PATH, 'utf-8');

  return new Promise((resolve, reject) => {
    db.exec(sql, async (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('✅ Database schema ready');

        // Run initial data inserts for new databases
        if (!dbExists) {
          await insertInitialData();
        }

        resolve();
      }
    });
  });
}

// Insert initial data (tags, colors, etc.)
async function insertInitialData() {
  if (!fs.existsSync(INIT_INSERTS_PATH)) {
    console.log('⚠️  No initial data file found, skipping');
    return;
  }

  // Check if data already exists
  const hasData = await new Promise((resolve) => {
    db.get('SELECT COUNT(*) as count FROM tags', (err, row) => {
      resolve(!err && row.count > 0);
    });
  });

  if (hasData) {
    console.log('✅ Initial data already exists');
    return;
  }

  return new Promise((resolve, reject) => {
    const insertSql = fs.readFileSync(INIT_INSERTS_PATH, 'utf-8');
    console.log('📝 Inserting initial data...');

    db.exec(insertSql, (err) => {
      if (err) {
        console.error('❌ Initial data insert failed:', err.message);
        reject(err);
      } else {
        console.log('✅ Initial data inserted');
        resolve();
      }
    });
  });
}

// Recursively scan directory using the modular indexer
async function scanDirectory(dir, parentId = null) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      try {
        const result = await indexSingleItem(db, fullPath, ROOT_DIRECTORY, parentId);

        // If it's a directory, recurse into it
        if (entry.isDirectory()) {
          await scanDirectory(fullPath, result.id);
        }
      } catch (error) {
        console.error(`❌ Failed to index ${entry.name}:`, error.message);
      }
    }
  } catch (error) {
    console.error(`❌ Cannot read directory ${dir}:`, error.message);
  }
}

// Main execution
async function main() {
  try {
    await setupDatabase();

    // Decide whether to scan files
    if (!dbExists || forceReindex) {
      const action = forceReindex ? 'Force re-indexing' : 'New database - indexing';
      console.log(`🔄 ${action} files...`);
      await scanDirectory(ROOT_DIRECTORY);
      console.log('🎉 File indexing complete');
    } else {
      console.log('✅ Database exists, skipping file scan (use --force to reindex)');
    }
  } catch (error) {
    console.error('💥 Setup failed:', error.message);
    process.exit(1);
  } finally {
    db.close(() => {
      console.log('👋 Database connection closed');
    });
  }
}

// Run it
main();
