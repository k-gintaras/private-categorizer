const fs = require('fs');
const path = require('path');

// File type detection (moved from index-folder.js)
const videoExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.webm', '.flv'];
const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'];
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.webp'];
const textExtensions = ['.txt', '.md', '.pdf', '.docx', '.rtf', '.html', '.json', '.csv'];

function getFileSubtype(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (videoExtensions.includes(ext)) return 'video';
  if (audioExtensions.includes(ext)) return 'audio';
  if (imageExtensions.includes(ext)) return 'image';
  if (textExtensions.includes(ext)) return 'text';
  return 'text';
}

/**
 * Index a single file or directory into the database
 */
async function indexSingleItem(db, fullPath, rootDirectory, parentId = null) {
  return new Promise((resolve, reject) => {
    const normalizedRoot = path.resolve(rootDirectory).replace(/\\/g, '/');
    const normalizedFullPath = path.resolve(fullPath).replace(/\\/g, '/');
    const relativePath = normalizedFullPath.replace(normalizedRoot, '');

    const stats = fs.statSync(fullPath);
    const isDirectory = stats.isDirectory();
    const type = isDirectory ? 'directory' : 'file';
    const subtype = isDirectory ? 'text' : getFileSubtype(fullPath);
    const size = isDirectory ? null : stats.size;
    const lastModified = stats.mtime.toISOString();

    // Check if already exists
    db.get(`SELECT id FROM files WHERE path = ?`, [relativePath], (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        resolve({ id: row.id, status: 'already_exists', type });
      } else {
        // Insert new item
        db.run(`INSERT INTO files (path, type, parent_id, size, last_modified, subtype) VALUES (?, ?, ?, ?, ?, ?)`, [relativePath, type, parentId, size, lastModified, subtype], function (err) {
          if (err) {
            reject(err);
          } else {
            console.log(`✅ Indexed: ${relativePath} (${subtype})`);
            resolve({ id: this.lastID, status: 'indexed', type });
          }
        });
      }
    });
  });
}

module.exports = { indexSingleItem, getFileSubtype };
