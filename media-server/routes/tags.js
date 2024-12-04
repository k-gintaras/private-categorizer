const express = require('express');
const router = express.Router();

module.exports = (db) => {
  router.get('/', (req, res) => {
    db.all('SELECT * FROM tags', [], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });

  router.post('/', (req, res) => {
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

  router.put('/:id', (req, res) => {
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

  router.delete('/:id', (req, res) => {
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

  return router;
};
