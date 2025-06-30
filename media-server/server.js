// server.js
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const cors = require('cors');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const filesRouter = require('./routes/files');
const likesRouter = require('./routes/likes');
const favoritesRouter = require('./routes/favorites');
const dislikesRouter = require('./routes/dislikes');
const analyticsRouter = require('./routes/analytics');
const tagsRouter = require('./routes/tags');
const colorsRouter = require('./routes/colors');
const uploadRouter = require('./routes/upload');

// Import health checker
const HealthChecker = require('../health-check');

const app = express();

console.log('🚀 Starting Media Server...');

// Function to run health check before server startup
async function runPreStartupChecks() {
  console.log('\n📋 Running pre-startup health checks...');

  const checker = new HealthChecker();
  const result = await checker.runAllChecks();

  if (!result.canStart) {
    console.log('\n❌ Critical issues found. Server cannot start safely.');
    console.log('💡 Fix the errors above and try again.');
    process.exit(1);
  }

  if (result.warnings > 0) {
    console.log('\n⚠️  Warnings detected but server can continue...');
    console.log('💡 Consider addressing warnings for optimal performance.');
  } else {
    console.log('\n✅ All health checks passed!');
  }

  console.log('\n🔧 Continuing with server startup...\n');
}

// Main server startup function
async function startServer() {
  // Run health checks first
  await runPreStartupChecks();

  // Configuration from environment
  const ROOT_DIRECTORY = process.env.ROOT_DIRECTORY || './static';
  const FILE_DB_PATH = process.env.FILE_DB_PATH || path.join(ROOT_DIRECTORY, 'file_paths.db');
  const PORT = process.env.MEDIA_SERVER_PORT || 3000;

  console.log(`📁 Root directory: ${ROOT_DIRECTORY}`);
  console.log(`🗃️  Database path: ${FILE_DB_PATH}`);
  console.log(`🌐 Server will start on port: ${PORT}`);

  // Validate critical paths after health check confirmation
  if (!fs.existsSync(ROOT_DIRECTORY)) {
    console.error(`❌ Critical: Root directory not found: ${ROOT_DIRECTORY}`);
    console.log('💡 This should have been caught by health check. Please run health check manually.');
    process.exit(1);
  }

  if (!fs.existsSync(FILE_DB_PATH)) {
    console.error(`❌ Critical: Database file not found: ${FILE_DB_PATH}`);
    console.log('💡 Run: npm run index-files');
    process.exit(1);
  }

  // Initialize database connection
  let db;
  try {
    db = new sqlite3.Database(FILE_DB_PATH, (err) => {
      if (err) {
        console.error('❌ Database connection failed:', err);
        process.exit(1);
      }
      console.log('✅ Database connected successfully');
    });
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
    process.exit(1);
  }

  // Configure Express middleware
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      const checker = new HealthChecker();
      const result = await checker.runAllChecks();

      res.status(result.canStart ? 200 : 500).json({
        status: result.canStart ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          passed: result.passed,
          total: result.total,
          warnings: result.warnings,
          errors: result.errors,
        },
        canStart: result.canStart,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Serve static files
  app.use(
    '/static',
    (req, res, next) => {
      console.log('📁 Serving static file:', req.path);
      next();
    },
    express.static(ROOT_DIRECTORY)
  );

  // API Routes
  app.use('/files', filesRouter(db));
  app.use('/likes', likesRouter(db));
  app.use('/favorites', favoritesRouter(db));
  app.use('/dislikes', dislikesRouter(db));
  app.use('/analytics', analyticsRouter(db));
  app.use('/tags', tagsRouter(db));
  app.use('/colors', colorsRouter(db));
  app.use('/upload', uploadRouter());

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('💥 Unhandled error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
      timestamp: new Date().toISOString(),
    });
  });

  // Start the server
  const server = app.listen(PORT, '0.0.0.0', (err) => {
    if (err) {
      console.error('❌ Failed to start server:', err);
      process.exit(1);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 MEDIA SERVER STARTED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`🌐 Server URL: http://0.0.0.0:${PORT}`);
    console.log(`🗃️  Database: ${FILE_DB_PATH}`);
    console.log(`📁 Root Directory: ${ROOT_DIRECTORY}`);
    console.log(`🏥 Health Check: http://0.0.0.0:${PORT}/health`);
    console.log('='.repeat(60));
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

    server.close((err) => {
      if (err) {
        console.error('❌ Error during server shutdown:', err);
        process.exit(1);
      }

      console.log('✅ Server closed successfully');

      if (db) {
        db.close((err) => {
          if (err) {
            console.error('❌ Error closing database:', err);
            process.exit(1);
          }
          console.log('✅ Database connections closed');
          console.log('👋 Goodbye!');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
  };

  // Register shutdown handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
  });
}

// Start the server
startServer().catch((error) => {
  console.error('💥 Failed to start server:', error);
  process.exit(1);
});
