const path = require('path');
const cors = require('cors');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Environment variables
const ROOT_DIRECTORY = process.env.ROOT_DIRECTORY || './static';
const FILE_DB_PATH = process.env.FILE_DB_PATH || './file_ids.db';
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
// Video Analytics API
// -------------------------

app.post('/analytics', (req, res) => {
  const { videoPath, playCount = 1, skips = [] } = req.body;

  if (!videoPath) {
    return res.status(400).json({ error: 'videoPath is required' });
  }

  const skipsJson = JSON.stringify(skips);

  db.run(
    `UPDATE video_analytics 
     SET play_count = play_count + ?,
         skips = ?,
         last_viewed = CURRENT_TIMESTAMP
     WHERE file_id = ?`,
    [playCount, skipsJson, videoPath],
    function (err) {
      if (err) {
        console.error('Update error:', err);
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        db.run(
          `INSERT INTO video_analytics (file_id, play_count, skips, last_viewed)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
          [videoPath, playCount, skipsJson],
          function (err) {
            if (err) {
              console.error('Insert error:', err);
              return res.status(500).json({ error: err.message });
            }
            res.json({
              message: 'Analytics inserted successfully',
              changes: this.changes,
            });
          }
        );
      } else {
        res.json({
          message: 'Analytics updated successfully',
          changes: this.changes,
        });
      }
    }
  );
});

app.get('/analytics/:videoPath', (req, res) => {
  const { videoPath } = req.params;

  db.get('SELECT * FROM video_analytics WHERE file_id = ?', [videoPath], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.json({
        file_id: videoPath,
        play_count: 0,
        skips: [],
        last_viewed: null,
      });
    }

    try {
      row.skips = JSON.parse(row.skips);
    } catch (e) {
      console.error('Error parsing skips JSON:', e);
      row.skips = [];
    }

    res.json(row);
  });
});

// -------------------------
// Image Analytics API
// -------------------------

app.post('/analytics/image', (req, res) => {
  const { imagePath, viewCount = 1, zoomInteractions = 0 } = req.body;

  if (!imagePath) {
    return res.status(400).json({ error: 'imagePath is required' });
  }

  db.run(
    `UPDATE image_analytics 
     SET view_count = view_count + ?,
         zoom_interactions = zoom_interactions + ?,
         last_viewed = CURRENT_TIMESTAMP
     WHERE file_id = ?`,
    [viewCount, zoomInteractions, imagePath],
    function (err) {
      if (err) {
        console.error('Update error:', err);
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        db.run(
          `INSERT INTO image_analytics (file_id, view_count, zoom_interactions, last_viewed)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
          [imagePath, viewCount, zoomInteractions],
          function (err) {
            if (err) {
              console.error('Insert error:', err);
              return res.status(500).json({ error: err.message });
            }
            res.json({
              message: 'Analytics inserted successfully',
              changes: this.changes,
            });
          }
        );
      } else {
        res.json({
          message: 'Analytics updated successfully',
          changes: this.changes,
        });
      }
    }
  );
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
// Error Handling
// -------------------------

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// -------------------------
// File Tags API
// -------------------------

// Get tags for a specific file
app.get('/files/:filePath/tags', (req, res) => {
  const { filePath } = req.params;

  db.all(`SELECT tag_id FROM file_tags WHERE file_id = ?`, [decodeURIComponent(filePath)], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: err.message });
    }
    // Return array of tag IDs
    res.json(rows.map((row) => row.tag_id));
  });
});

// Add a tag to a file
app.post('/files/:filePath/tags', (req, res) => {
  const { filePath } = req.params;
  const { tagId } = req.body;

  if (!tagId) {
    return res.status(400).json({ error: 'tagId is required' });
  }

  db.run('INSERT INTO file_tags (file_id, tag_id) VALUES (?, ?)', [decodeURIComponent(filePath), tagId], function (err) {
    if (err) {
      // If error is due to unique constraint, return success since the relationship exists
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.json({ message: 'Tag already exists for file' });
      }
      console.error('Database error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: 'Tag added successfully' });
  });
});

// Remove a tag from a file
app.delete('/files/:filePath/tags/:tagId', (req, res) => {
  const { filePath, tagId } = req.params;

  db.run('DELETE FROM file_tags WHERE file_id = ? AND tag_id = ?', [decodeURIComponent(filePath), tagId], function (err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'File-tag relationship not found' });
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
