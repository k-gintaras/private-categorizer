const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Fetch all files
  router.get('/', async (req, res) => {
    try {
      const files = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM files', [], (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        });
      });
      res.json(files);
    } catch (error) {
      console.error('Error fetching files:', error);
      res.status(500).json({ error: 'Failed to fetch files.' });
    }
  });

  router.get('/:fileId/full', async (req, res) => {
    const { fileId } = req.params;

    try {
      // Fetch file data
      const file = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM files WHERE id = ?', [fileId], (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      });

      if (!file) {
        return res.status(404).json({ error: 'File not found.' });
      }

      // Optimize queries for tags, analytics, likes, dislikes, and favorites
      const [tags, analytics, likes, dislikes, favorite] = await Promise.all([
        // Fetch tags for the file
        new Promise((resolve, reject) => {
          db.all('SELECT tag_id FROM file_tags WHERE file_id = ?', [fileId], (err, rows) => {
            if (err) reject(err);
            resolve(rows.map((row) => row.tag_id));
          });
        }),

        // Fetch analytics for the file
        new Promise((resolve, reject) => {
          db.get('SELECT * FROM analytics WHERE file_id = ?', [fileId], (err, row) => {
            if (err) reject(err);
            resolve(row || null);
          });
        }),

        // Fetch likes for the file
        new Promise((resolve, reject) => {
          db.all('SELECT * FROM likes WHERE file_id = ?', [fileId], (err, rows) => {
            if (err) reject(err);
            resolve(rows || []);
          });
        }),

        // Fetch dislikes for the file
        new Promise((resolve, reject) => {
          db.all('SELECT * FROM dislikes WHERE file_id = ?', [fileId], (err, rows) => {
            if (err) reject(err);
            resolve(rows || []);
          });
        }),

        // Fetch favorite for the file
        new Promise((resolve, reject) => {
          db.get('SELECT * FROM favorites WHERE file_id = ?', [fileId], (err, row) => {
            if (err) reject(err);
            resolve(row || null);
          });
        }),
      ]);

      // Prepare the response
      const response = {
        ...file,
        tags,
        analytics: analytics || undefined,
        likes,
        likeCount: likes.length,
        dislikes,
        dislikeCount: dislikes.length,
        favorite: favorite || null,
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching detailed file data:', error);
      res.status(500).json({ error: 'Failed to fetch detailed file data.' });
    }
  });

  return router;
};
