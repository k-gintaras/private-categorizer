const express = require('express');
const router = express.Router();

module.exports = (db) => {
  /**
   * Add a new color palette.
   */
  router.post('/', (req, res) => {
    const { name, colorPalette } = req.body;

    if (!name || !colorPalette) {
      return res.status(400).json({ error: 'Name and colorPalette are required.' });
    }

    db.run(`INSERT INTO colors (name, color_palette) VALUES (?, ?)`, [name, JSON.stringify(colorPalette)], function (err) {
      if (err) {
        console.error('Error adding color palette:', err);
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({ id: this.lastID, name, colorPalette });
    });
  });

  /**
   * Fetch all color palettes.
   */
  router.get('/', (req, res) => {
    db.all('SELECT * FROM colors', [], (err, rows) => {
      if (err) {
        console.error('Error fetching color palettes:', err);
        return res.status(500).json({ error: err.message });
      }

      const palettes = rows.map((row) => ({
        id: row.id,
        name: row.name,
        colors: JSON.parse(row.color_palette),
      }));

      res.json(palettes);
    });
  });

  /**
   * Fetch a specific color palette by ID.
   */
  router.get('/:id', (req, res) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'ID is required.' });
    }

    db.get('SELECT * FROM colors WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error fetching color palette:', err);
        return res.status(500).json({ error: err.message });
      }

      if (!row) {
        return res.status(404).json({ error: 'Color palette not found.' });
      }

      res.json({
        id: row.id,
        name: row.name,
        colors: JSON.parse(row.color_palette),
      });
    });
  });

  /**
   * Delete a color palette by ID.
   */
  router.delete('/:id', (req, res) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'ID is required.' });
    }

    db.run('DELETE FROM colors WHERE id = ?', [id], function (err) {
      if (err) {
        console.error('Error deleting color palette:', err);
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Color palette not found.' });
      }

      res.status(200).json({ message: 'Color palette deleted successfully.' });
    });
  });

  return router;
};
