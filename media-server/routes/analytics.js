const express = require('express');
const router = express.Router();

/**
 * Helper function to merge skips and keep the top 10 most popular.
 * @param {Array} existingSkips - Current skips in the database.
 * @param {Array} newSkips - Incoming skips from the request.
 * @param {number} roundTo - Rounding interval for timestamps (e.g., 5 seconds).
 * @returns {Array} - Updated array of top 10 skips.
 */
function mergeAndLimitSkips(existingSkips, newSkips, roundTo = 5) {
  const skipMap = new Map();

  // Round a number to the nearest `roundTo` value
  const roundTime = (time) => Math.round(time / roundTo) * roundTo;

  // Ensure `newSkips` is an array
  if (!Array.isArray(newSkips)) {
    console.warn('newSkips is not an array:', newSkips);
    newSkips = [];
  }

  // Add existing skips to the map
  existingSkips.forEach(({ time, count }) => {
    const roundedTime = roundTime(time);
    skipMap.set(roundedTime, (skipMap.get(roundedTime) || 0) + count);
  });

  // Update or add new skips to the map
  newSkips.forEach((time) => {
    const roundedTime = roundTime(time);
    skipMap.set(roundedTime, (skipMap.get(roundedTime) || 0) + 1);
  });

  // Convert map to array, sort by count (desc) and time (asc), and keep top 10
  const sortedSkips = Array.from(skipMap.entries())
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => b.count - a.count || a.time - b.time)
    .slice(0, 10);

  return sortedSkips;
}

module.exports = (db) => {
  /**
   * Increment the view count for a file.
   */
  router.post('/view', (req, res) => {
    const { fileId, fileType: subtype } = req.body;

    if (!fileId || !subtype) {
      return res.status(400).json({ error: 'fileId and fileType are required.' });
    }
    db.run(
      `UPDATE analytics
     SET view_count = view_count + 1,
         last_viewed = CURRENT_TIMESTAMP
     WHERE file_id = ? AND file_type = ?`,
      [fileId, subtype],
      function (err) {
        if (err) {
          console.error('Error incrementing view count:', err);
          return res.status(500).json({ error: 'Failed to increment view count.' });
        }

        if (this.changes === 0) {
          console.log('No matching row found. Executing INSERT query...');
          db.run(
            `INSERT INTO analytics (file_id, file_type, view_count, last_viewed)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            [fileId, subtype, 1],
            function (err) {
              if (err) {
                console.error('Error inserting view count:', err);
                return res.status(500).json({ error: 'Failed to insert view count.' });
              }
              console.log('View count inserted successfully for fileId:', fileId);
              res.json({ message: 'View count incremented successfully.' });
            }
          );
        } else {
          console.log('View count incremented for fileId:', fileId);
          res.json({ message: 'View count incremented successfully.' });
        }
      }
    );
  });

  /**
   * Update other analytics for a file (e.g., playTime, skips).
   */
  router.post('/update', (req, res) => {
    const { fileId, fileType, totalWatchTime = 0, skips = [], scrollUpCount = 0, scrollDownCount = 0 } = req.body;

    if (!fileId || !fileType) {
      return res.status(400).json({ error: 'fileId and fileType are required.' });
    }

    const roundTo = 5; // Round skips to the nearest 5 seconds

    db.get(`SELECT skips FROM analytics WHERE file_id = ? AND file_type = ?`, [fileId, fileType], (err, row) => {
      if (err) {
        console.error('Error fetching existing skips:', err);
        return res.status(500).json({ error: 'Database query error.' });
      }

      let existingSkips = [];
      try {
        if (row?.skips) {
          existingSkips = JSON.parse(row.skips);
        }
      } catch (parseErr) {
        console.error('Error parsing existing skips:', parseErr);
      }

      // Merge skips and keep the top 10
      const updatedSkips = mergeAndLimitSkips(existingSkips, skips, roundTo);

      const updateQuery = `
        UPDATE analytics
        SET 
          total_watch_time = total_watch_time + ?,
          skips = ?,
          scroll_up_count = scroll_up_count + ?,
          scroll_down_count = scroll_down_count + ?,
          last_viewed = CURRENT_TIMESTAMP
        WHERE file_id = ? AND file_type = ?`;

      const insertQuery = `
        INSERT INTO analytics (
          file_id, file_type, total_watch_time, skips, scroll_up_count,
          scroll_down_count, last_viewed
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;

      const params = [totalWatchTime, JSON.stringify(updatedSkips), scrollUpCount, scrollDownCount, fileId, fileType];

      if (row) {
        db.run(updateQuery, params, function (err) {
          if (err) {
            console.error('Error updating analytics:', err);
            return res.status(500).json({ error: 'Failed to update analytics.' });
          }
          res.json({ message: 'Analytics updated successfully.' });
        });
      } else {
        db.run(insertQuery, [fileId, fileType, totalWatchTime, JSON.stringify(updatedSkips), scrollUpCount, scrollDownCount], function (err) {
          if (err) {
            console.error('Error inserting analytics:', err);
            return res.status(500).json({ error: 'Failed to insert analytics.' });
          }
          res.json({ message: 'Analytics inserted successfully.' });
        });
      }
    });
  });

  /**
   * Fetch analytics for a specific file.
   */
  router.get('/:fileId', (req, res) => {
    const { fileId } = req.params;

    db.get(`SELECT * FROM analytics WHERE file_id = ?`, [fileId], (err, row) => {
      if (err) {
        console.error('Error fetching analytics:', err);
        return res.status(500).json({ error: err.message });
      }

      if (!row) {
        return res.json(null);
      }

      try {
        if (row.skips) {
          row.skips = JSON.parse(row.skips);
        }
      } catch (parseErr) {
        console.error('Error parsing skips JSON:', parseErr);
        row.skips = [];
      }

      res.json(row);
    });
  });

  return router;
};
