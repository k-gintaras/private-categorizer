const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Fetch all tags
  router.get('/', (req, res) => {
    db.all('SELECT * FROM tags ORDER BY name ASC', [], (err, rows) => {
      if (err) {
        console.error('Error fetching tags:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });

  // Create a new tag
  router.post('/', (req, res) => {
    const { name, tagGroup, color } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required and must be a string' });
    }

    db.run('INSERT INTO tags (name, tag_group, color) VALUES (?, ?, ?)', [name.trim(), tagGroup?.trim() || null, color?.trim() || null], function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'A tag with this name already exists in the specified group.' });
        }
        console.error('Error creating tag:', err);
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        name,
        tagGroup,
        color,
      });
    });
  });

  // Update an existing tag
  router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, tagGroup, color } = req.body;

    if (!name && !tagGroup && !color) {
      return res.status(400).json({ error: 'At least one of name, tagGroup, or color must be provided.' });
    }

    db.run(
      'UPDATE tags SET name = COALESCE(?, name), tag_group = COALESCE(?, tag_group), color = COALESCE(?, color) WHERE id = ?',
      [name?.trim() || null, tagGroup?.trim() || null, color?.trim() || null, id],
      function (err) {
        if (err) {
          console.error('Error updating tag:', err);
          return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Tag not found.' });
        }

        res.status(200).json({ message: 'Tag updated successfully.' });
      }
    );
  });

  // Delete a tag
  router.delete('/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM tags WHERE id = ?', [id], function (err) {
      if (err) {
        console.error('Error deleting tag:', err);
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Tag not found.' });
      }

      res.status(204).send();
    });
  });

  // Associate a tag with a file
  router.post('/file-associations', (req, res) => {
    const { fileId, tagId } = req.body;

    if (!fileId || !tagId) {
      return res.status(400).json({ error: 'fileId and tagId are required.' });
    }

    db.run('INSERT INTO file_tags (file_id, tag_id) VALUES (?, ?)', [fileId, tagId], function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'This tag is already associated with the file.' });
        }
        console.error('Error associating tag with file:', err);
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({ success: true, fileId, tagId });
    });
  });

  // Remove a tag from a file
  router.delete('/file-associations/:fileId/:tagId', (req, res) => {
    const { fileId, tagId } = req.params;

    db.run('DELETE FROM file_tags WHERE file_id = ? AND tag_id = ?', [fileId, tagId], function (err) {
      if (err) {
        console.error('Error removing tag from file:', err);
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'No association found for the specified fileId and tagId.' });
      }

      res.status(204).send();
    });
  });

  return router;
};
