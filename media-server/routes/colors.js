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

    if (!Array.isArray(colorPalette) || !colorPalette.every((color) => typeof color === 'string')) {
      return res.status(400).json({ error: 'colorPalette must be an array of strings.' });
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

      const palettes = [];
      const invalidEntries = [];

      rows.forEach((row) => {
        try {
          palettes.push({
            id: row.id,
            name: row.name,
            colors: JSON.parse(row.color_palette), // Parse JSON safely
          });
        } catch (error) {
          console.warn(`Invalid color_palette for ID ${row.id}:`, row.color_palette);
          invalidEntries.push({ id: row.id, error: 'Invalid color_palette format.' });
        }
      });

      res.json({
        palettes,
        ...(invalidEntries.length > 0 && { invalidEntries }), // Include invalid entries if any
      });
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
