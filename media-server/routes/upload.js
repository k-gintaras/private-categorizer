const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { indexSingleItem } = require('./index-file');
const router = express.Router();

module.exports = (db) => {
  // Now accepts db parameter
  const ROOT_DIRECTORY = process.env.ROOT_DIRECTORY || './static';
  const UPLOAD_MEGABYTES_LIMIT = 5000; // 5GB limit

  // Ensure upload directory exists
  if (!fs.existsSync(ROOT_DIRECTORY)) {
    fs.mkdirSync(ROOT_DIRECTORY, { recursive: true });
  }

  // Configure multer for file storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = req.body.folder ? path.join(ROOT_DIRECTORY, req.body.folder) : ROOT_DIRECTORY;

      // Create subfolder if it doesn't exist
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Keep original filename or allow override
      const filename = req.body.filename || file.originalname;
      cb(null, filename);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: UPLOAD_MEGABYTES_LIMIT * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      // Accept common media types
      const allowedTypes = /\.(mp4|avi|mkv|mov|mp3|wav|jpg|jpeg|png|gif|pdf|txt)$/i;
      if (allowedTypes.test(file.originalname)) {
        cb(null, true);
      } else {
        cb(new Error('File type not supported'));
      }
    },
  });

  /**
   * Upload single file and auto-index
   * POST /upload
   * Body: file (multipart), folder (optional), filename (optional)
   */
  router.post('/', upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const relativePath = req.file.path.replace(ROOT_DIRECTORY, '').replace(/\\/g, '/');

    try {
      // Auto-index the uploaded file
      const indexResult = await indexSingleItem(db, req.file.path, ROOT_DIRECTORY);

      res.json({
        message: 'File uploaded and indexed successfully',
        file: {
          originalName: req.file.originalname,
          filename: req.file.filename,
          path: relativePath,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
        indexing: {
          status: indexResult.status,
          fileId: indexResult.id,
        },
      });
    } catch (error) {
      console.error('Error indexing uploaded file:', error);
      // File uploaded but indexing failed - still return success but with warning
      res.json({
        message: 'File uploaded but indexing failed',
        file: {
          originalName: req.file.originalname,
          filename: req.file.filename,
          path: relativePath,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
        indexing: {
          status: 'failed',
          error: error.message,
        },
      });
    }
  });

  /**
   * Upload multiple files and auto-index all
   * POST /upload/multiple
   */
  router.post('/multiple', upload.array('files', 10), async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];

    for (const file of req.files) {
      const relativePath = file.path.replace(ROOT_DIRECTORY, '').replace(/\\/g, '/');

      try {
        const indexResult = await indexSingleItem(db, file.path, ROOT_DIRECTORY);

        results.push({
          originalName: file.originalname,
          filename: file.filename,
          path: relativePath,
          size: file.size,
          mimetype: file.mimetype,
          indexing: {
            status: indexResult.status,
            fileId: indexResult.id,
          },
        });
      } catch (error) {
        console.error(`Error indexing ${file.originalname}:`, error);

        results.push({
          originalName: file.originalname,
          filename: file.filename,
          path: relativePath,
          size: file.size,
          mimetype: file.mimetype,
          indexing: {
            status: 'failed',
            error: error.message,
          },
        });
      }
    }

    const successful = results.filter((r) => r.indexing.status !== 'failed').length;
    const failed = results.length - successful;

    res.json({
      message: `${results.length} files uploaded, ${successful} indexed successfully${failed > 0 ? `, ${failed} indexing failed` : ''}`,
      files: results,
    });
  });

  /**
   * Get upload info/limits
   * GET /upload/info
   */
  router.get('/info', (req, res) => {
    res.json({
      maxFileSize: UPLOAD_MEGABYTES_LIMIT + 'MB',
      allowedTypes: ['mp4', 'avi', 'mkv', 'mov', 'mp3', 'wav', 'jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt'],
      uploadPath: ROOT_DIRECTORY,
    });
  });

  return router;
};
