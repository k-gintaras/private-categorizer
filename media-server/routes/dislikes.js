const express = require('express');
const router = express.Router();

/**
 * Helper function to round timestamps to the nearest second (or other interval).
 * @param {number} timestamp - The timestamp to round.
 * @param {number} interval - The interval to round to (default: 1 second).
 * @returns {number} - The rounded timestamp.
 */
function roundTimestamp(timestamp, interval = 1) {
  return Math.round(timestamp / interval) * interval;
}

module.exports = (db) => {
  /**
   * Add a new dislike for a specific file at a specific timestamp.
   */
  router.post('/', (req, res) => {
    const { fileId, timestamp } = req.body;

    if (!fileId || timestamp == null) {
      return res.status(400).json({ error: 'fileId and timestamp are required' });
    }

    const roundedTimestamp = roundTimestamp(timestamp);

    db.run('INSERT INTO dislikes (file_id, timestamp) VALUES (?, ?)', [fileId, roundedTimestamp], function (err) {
      if (err) {
        console.error('Error adding dislike:', err);
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({ id: this.lastID, fileId, timestamp: roundedTimestamp });
    });
  });

  /**
   * Fetch all dislikes for a specific file.
   */
  router.get('/:fileId', (req, res) => {
    const { fileId } = req.params;

    if (!fileId) {
      return res.status(400).json({ error: 'fileId is required' });
    }

    db.all('SELECT * FROM dislikes WHERE file_id = ? ORDER BY timestamp ASC', [fileId], (err, rows) => {
      if (err) {
        console.error('Error fetching dislikes:', err);
        return res.status(500).json({ error: err.message });
      }

      res.json(rows);
    });
  });

  /**
   * Remove a dislike by its ID.
   */
  router.delete('/:id', (req, res) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Dislike ID is required' });
    }

    db.run('DELETE FROM dislikes WHERE id = ?', [id], function (err) {
      if (err) {
        console.error('Error removing dislike:', err);
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Dislike not found' });
      }

      res.status(200).json({ message: 'Dislike removed successfully' });
    });
  });

  return router;
};
