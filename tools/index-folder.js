const path = require('path');
const cors = require('cors');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Environment variables
const ROOT_DIRECTORY = process.env.ROOT_DIRECTORY || './static';
const FILE_DB_PATH = process.env.FILE_DB_PATH || './file_paths.db';
const PORT = process.env.MEDIA_SERVER_PORT || 3000;

// Initialize database connections
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

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static files with logging
app.use(
  '/static',
  (req, res, next) => {
    console.log('Serving static file:', req.path);
    next();
  },
  express.static(ROOT_DIRECTORY)
);

// -------------------------
// Files API
// -------------------------

app.get('/files', (req, res) => {
  const sql = 'SELECT * FROM files';
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// -------------------------
// File Tags API
// -------------------------

// Get tags associated with a file
app.get('/files/:fileId/tags', (req, res) => {
  const { fileId } = req.params;
  const sql = `
    SELECT t.id, t.name, t.tag_group, t.color
    FROM file_tags ft
    JOIN tags t ON ft.tag_id = t.id
    WHERE ft.file_id = ?
  `;
  db.all(sql, [fileId], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Add a tag to a file
app.post('/files/:fileId/tags', (req, res) => {
  const { fileId } = req.params;
  const { tagId } = req.body;

  if (!tagId) {
    return res.status(400).json({ error: 'tagId is required' });
  }

  const sql = 'INSERT INTO file_tags (file_id, tag_id) VALUES (?, ?)';
  db.run(sql, [fileId, tagId], function (err) {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ id: this.lastID, fileId, tagId });
  });
});

// Remove a tag from a file
app.delete('/files/:fileId/tags/:tagId', (req, res) => {
  const { fileId, tagId } = req.params;

  const sql = 'DELETE FROM file_tags WHERE file_id = ? AND tag_id = ?';
  db.run(sql, [fileId, tagId], function (err) {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tag not found for this file' });
    }
    res.status(204).send(); // No content
  });
});

// -------------------------
// Tags API
// -------------------------

app.get('/tags', (req, res) => {
  db.all('SELECT * FROM tags', [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/tags', (req, res) => {
  const { name, tag_group, color } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  db.run('INSERT INTO tags (name, tag_group, color) VALUES (?, ?, ?)', [name, tag_group, color], function (err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      name,
      tag_group,
      color,
    });
  });
});

app.put('/tags/:id', (req, res) => {
  const { id } = req.params;
  const { name, tag_group, color } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  db.run('UPDATE tags SET name = ?, tag_group = ?, color = ? WHERE id = ?', [name, tag_group, color, id], function (err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    res.json({ id, name, tag_group, color });
  });
});

app.delete('/tags/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM tags WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    res.status(204).send();
  });
});

// -------------------------
// Start the server
// -------------------------

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Files database: ${FILE_DB_PATH}`);
  console.log(`Root directory: ${ROOT_DIRECTORY}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing database connections...');
  db.close(() => {
    console.log('Database connections closed. Exiting...');
    process.exit(0);
  });
});
