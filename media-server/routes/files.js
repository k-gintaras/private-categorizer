const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Fetch all files
  router.get('/', (req, res) => {
    db.all('SELECT * FROM files', [], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });

  // Fetch detailed file data including analytics, tags, and likes
  router.get('/:fileId/full', (req, res) => {
    const { fileId } = req.params;

    db.get('SELECT * FROM files WHERE id = ?', [fileId], (err, file) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: err.message });
      }
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      const promises = [
        // Fetch tags for the file
        new Promise((resolve, reject) => {
          db.all('SELECT tag_id FROM file_tags WHERE file_id = ?', [file.id], (err, rows) => {
            if (err) reject(err);
            resolve(rows.map((row) => row.tag_id));
          });
        }),
        // Fetch analytics for the file
        new Promise((resolve, reject) => {
          db.get('SELECT * FROM analytics WHERE file_id = ?', [file.id], (err, analytics) => {
            if (err) reject(err);
            resolve(analytics || null); // Return null if no analytics found
          });
        }),
        // Fetch likes for the file
        new Promise((resolve, reject) => {
          db.all('SELECT * FROM likes WHERE file_id = ?', [file.id], (err, likes) => {
            if (err) reject(err);
            resolve(likes || []);
          });
        }),
      ];

      Promise.all(promises)
        .then(([tags, analytics, likes]) => {
          const response = {
            ...file,
            tags,
            likes,
            likeCount: likes.length,
          };

          // Only include analytics if it exists
          if (analytics) {
            response.analytics = analytics;
          }

          res.json(response);
        })
        .catch((error) => {
          console.error('Error fetching file data:', error);
          res.status(500).json({ error: error.message });
        });
    });
  });

  return router;
};
