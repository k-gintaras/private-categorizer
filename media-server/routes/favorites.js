const express = require('express');
const router = express.Router();

module.exports = (db) => {
  /**
   * Add a favorite for a specific file.
   * Only one favorite is allowed per file (enforced by UNIQUE constraint on file_id).
   */
  router.post('/', (req, res) => {
    const { fileId } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: 'fileId is required' });
    }

    db.run('INSERT INTO favorites (file_id) VALUES (?)', [fileId], function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'File is already marked as favorite.' });
        }
        console.error('Error adding favorite:', err);
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({ id: this.lastID, fileId });
    });
  });

  /**
   * Fetch the favorite for a specific file.
   */
  router.get('/:fileId', (req, res) => {
    const { fileId } = req.params;

    if (!fileId) {
      return res.status(400).json({ error: 'fileId is required' });
    }

    db.get('SELECT * FROM favorites WHERE file_id = ?', [fileId], (err, row) => {
      if (err) {
        console.error('Error fetching favorite:', err);
        return res.status(500).json({ error: err.message });
      }

      if (!row) {
        return res.status(404).json({ error: 'Favorite not found for this file.' });
      }

      res.json(row);
    });
  });

  /**
   * Remove the favorite for a specific file.
   */
  router.delete('/:fileId', (req, res) => {
    const { fileId } = req.params;

    if (!fileId) {
      return res.status(400).json({ error: 'fileId is required' });
    }

    db.run('DELETE FROM favorites WHERE file_id = ?', [fileId], function (err) {
      if (err) {
        console.error('Error removing favorite:', err);
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Favorite not found for this file.' });
      }

      res.status(200).json({ message: 'Favorite removed successfully.' });
    });
  });

  return router;
};
