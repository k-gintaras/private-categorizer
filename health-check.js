// health-check.js
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

class HealthChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.checks = 0;
    this.passed = 0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '✓',
      warn: '⚠',
      error: '✗',
    }[type];

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addError(message) {
    this.errors.push(message);
    this.log(message, 'error');
  }

  addWarning(message) {
    this.warnings.push(message);
    this.log(message, 'warn');
  }

  addSuccess(message) {
    this.passed++;
    this.log(message, 'info');
  }

  check(description, testFn) {
    this.checks++;
    try {
      const result = testFn();
      if (result === true) {
        this.addSuccess(description);
      } else if (result === false) {
        this.addError(`FAILED: ${description}`);
      } else {
        this.addWarning(`WARNING: ${description} - ${result}`);
      }
    } catch (error) {
      this.addError(`ERROR in ${description}: ${error.message}`);
    }
  }

  async asyncCheck(description, testFn) {
    this.checks++;
    try {
      const result = await testFn();
      if (result === true) {
        this.addSuccess(description);
      } else if (result === false) {
        this.addError(`FAILED: ${description}`);
      } else {
        this.addWarning(`WARNING: ${description} - ${result}`);
      }
    } catch (error) {
      this.addError(`ERROR in ${description}: ${error.message}`);
    }
  }

  // Check if environment variables are properly configured
  checkEnvironmentVariables() {
    const requiredEnvVars = {
      ROOT_DIRECTORY: process.env.ROOT_DIRECTORY,
      FILE_DB_PATH: process.env.FILE_DB_PATH,
      MEDIA_SERVER_PORT: process.env.MEDIA_SERVER_PORT,
      SERVER_HOST: process.env.SERVER_HOST,
      SERVER_URL: process.env.SERVER_URL,
      DOCKER_VOLUME_PATH: process.env.DOCKER_VOLUME_PATH,
    };

    // Check if .env file exists
    const envPath = path.resolve(__dirname, '.env');
    this.check('Environment file (.env) exists', () => {
      return fs.existsSync(envPath);
    });

    // Check each required environment variable
    Object.entries(requiredEnvVars).forEach(([key, value]) => {
      this.check(`Environment variable ${key} is set`, () => {
        if (!value) return false;
        if (value.includes('localhost') && key.includes('HOST')) {
          return 'Using localhost - may not work for network access';
        }
        return true;
      });
    });

    // Check for default values that should be changed
    const defaultChecks = [
      {
        key: 'ROOT_DIRECTORY',
        defaults: ['./static', 'G:/My Drive/Photo to Organize'],
        message: 'ROOT_DIRECTORY appears to be using default path',
      },
      {
        key: 'SERVER_HOST',
        defaults: ['localhost', '0.0.0.0'],
        message: 'SERVER_HOST is using default value',
      },
      {
        key: 'MEDIA_SERVER_PORT',
        defaults: ['3000', '4000'],
        message: 'MEDIA_SERVER_PORT is using default value',
      },
    ];

    defaultChecks.forEach(({ key, defaults, message }) => {
      const value = process.env[key];
      if (value && defaults.includes(value)) {
        this.addWarning(`${message}: ${value}`);
      }
    });
  }

  // Check if directories exist and are accessible
  checkDirectories() {
    const directories = [
      { path: process.env.ROOT_DIRECTORY, name: 'Root Directory' },
      { path: path.dirname(process.env.FILE_DB_PATH || ''), name: 'Database Directory' },
    ];

    directories.forEach(({ path: dirPath, name }) => {
      if (!dirPath) return;

      this.check(`${name} exists (${dirPath})`, () => {
        return fs.existsSync(dirPath);
      });

      this.check(`${name} is readable`, () => {
        try {
          fs.accessSync(dirPath, fs.constants.R_OK);
          return true;
        } catch {
          return false;
        }
      });

      this.check(`${name} is writable`, () => {
        try {
          fs.accessSync(dirPath, fs.constants.W_OK);
          return true;
        } catch {
          return false;
        }
      });
    });
  }

  // Check database connectivity and schema
  async checkDatabase() {
    const dbPath = process.env.FILE_DB_PATH;

    if (!dbPath) {
      this.addError('FILE_DB_PATH not configured');
      return;
    }

    await this.asyncCheck('Database file exists', async () => {
      return fs.existsSync(dbPath);
    });

    await this.asyncCheck('Database is accessible', async () => {
      return new Promise((resolve) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
          if (err) {
            resolve(false);
          } else {
            db.close();
            resolve(true);
          }
        });
      });
    });

    // Check required tables exist
    const requiredTables = ['files', 'tags', 'colors', 'analytics', 'likes', 'dislikes', 'favorites', 'file_tags'];

    for (const table of requiredTables) {
      await this.asyncCheck(`Database table '${table}' exists`, async () => {
        return new Promise((resolve) => {
          const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
              resolve(false);
              return;
            }

            db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [table], (err, row) => {
              db.close();
              if (err) {
                resolve(false);
              } else {
                resolve(!!row);
              }
            });
          });
        });
      });
    }
  }

  // Check if files are indexed
  async checkFileIndexing() {
    const dbPath = process.env.FILE_DB_PATH;
    const rootDir = process.env.ROOT_DIRECTORY;

    if (!dbPath || !rootDir) {
      this.addError('Cannot check file indexing - missing database or root directory path');
      return;
    }

    await this.asyncCheck('Files are indexed in database', async () => {
      return new Promise((resolve) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
          if (err) {
            resolve(false);
            return;
          }

          db.get("SELECT COUNT(*) as count FROM files WHERE type = 'file'", (err, row) => {
            db.close();
            if (err) {
              resolve(false);
            } else {
              const fileCount = row.count;
              if (fileCount === 0) {
                resolve('No files found in database - run indexing');
              } else {
                resolve(true);
              }
            }
          });
        });
      });
    });

    // Check for recent indexing
    await this.asyncCheck('Database has recent activity', async () => {
      return new Promise((resolve) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
          if (err) {
            resolve(false);
            return;
          }

          db.get('SELECT created_at FROM files ORDER BY created_at DESC LIMIT 1', (err, row) => {
            db.close();
            if (err || !row) {
              resolve('No files found in database');
            } else {
              const lastIndexed = new Date(row.created_at);
              const daysSinceIndexed = (Date.now() - lastIndexed.getTime()) / (1000 * 60 * 60 * 24);

              if (daysSinceIndexed > 7) {
                resolve(`Last indexed ${Math.floor(daysSinceIndexed)} days ago - consider re-indexing`);
              } else {
                resolve(true);
              }
            }
          });
        });
      });
    });
  }

  // Check network configuration
  checkNetworkConfig() {
    const serverHost = process.env.SERVER_HOST;
    const serverUrl = process.env.SERVER_URL;
    const port = process.env.MEDIA_SERVER_PORT;

    this.check('Server URL matches host and port configuration', () => {
      if (!serverUrl || !serverHost || !port) return false;

      const expectedUrl = `http://${serverHost}:${port}`;
      if (serverUrl !== expectedUrl) {
        return `Mismatch: SERVER_URL=${serverUrl}, expected=${expectedUrl}`;
      }
      return true;
    });

    this.check('Port is valid', () => {
      const portNum = parseInt(port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        return false;
      }
      if (portNum < 1024) {
        return 'Port < 1024 may require elevated privileges';
      }
      return true;
    });
  }

  // Check Docker configuration if applicable
  checkDockerConfig() {
    const isDocker = process.env.IS_DOCKER === 'true';
    const dockerVolumePath = process.env.DOCKER_VOLUME_PATH;

    if (isDocker) {
      this.check('Docker volume path configured', () => {
        return !!dockerVolumePath;
      });

      this.check('Docker Compose file exists', () => {
        return fs.existsSync(path.join(__dirname, 'docker-compose.yml'));
      });
    } else {
      this.addSuccess('Running in non-Docker mode');
    }
  }

  // Generate summary report
  generateSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('                 HEALTH CHECK SUMMARY');
    console.log('='.repeat(60));

    console.log(`✓ Passed: ${this.passed}/${this.checks}`);
    console.log(`⚠ Warnings: ${this.warnings.length}`);
    console.log(`✗ Errors: ${this.errors.length}`);

    if (this.warnings.length > 0) {
      console.log('\n⚠ WARNINGS:');
      this.warnings.forEach((warning) => console.log(`  - ${warning}`));
    }

    if (this.errors.length > 0) {
      console.log('\n✗ CRITICAL ERRORS:');
      this.errors.forEach((error) => console.log(`  - ${error}`));
      console.log('\n🚨 Server may not start properly with these errors!');
    }

    console.log('\n' + '='.repeat(60));

    return {
      passed: this.passed,
      total: this.checks,
      warnings: this.warnings.length,
      errors: this.errors.length,
      canStart: this.errors.length === 0,
    };
  }

  // Provide recommendations
  provideRecommendations() {
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 All checks passed! Server is ready to start.');
      return;
    }

    console.log('\n📋 RECOMMENDATIONS:');

    if (this.errors.some((e) => e.includes('database') || e.includes('indexed'))) {
      console.log('  🔧 Run: npm run index-files');
    }

    if (this.errors.some((e) => e.includes('Environment'))) {
      console.log('  🔧 Check your .env file configuration');
    }

    if (this.errors.some((e) => e.includes('Directory'))) {
      console.log('  🔧 Verify directory paths in .env file');
      console.log('  🔧 Create missing directories or update paths');
    }

    if (this.warnings.some((w) => w.includes('default'))) {
      console.log('  ⚡ Consider updating default values in .env for your environment');
    }

    if (this.warnings.some((w) => w.includes('days ago'))) {
      console.log('  ⚡ Consider running: npm run reindex');
    }
  }

  async runAllChecks() {
    console.log('🔍 Starting health check...\n');

    this.checkEnvironmentVariables();
    this.checkDirectories();
    this.checkNetworkConfig();
    this.checkDockerConfig();

    await this.checkDatabase();
    await this.checkFileIndexing();

    const summary = this.generateSummary();
    this.provideRecommendations();

    return summary;
  }
}

// Main execution
async function main() {
  const checker = new HealthChecker();
  const result = await checker.runAllChecks();

  // Exit with error code if critical issues found
  if (!result.canStart) {
    console.log('\n❌ Health check failed - resolve errors before starting server');
    process.exit(1);
  } else if (result.warnings > 0) {
    console.log('\n⚠️  Health check passed with warnings - server can start but issues should be addressed');
    process.exit(0);
  } else {
    console.log('\n✅ Health check passed - server ready to start');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Health check failed:', error);
    process.exit(1);
  });
}

module.exports = HealthChecker;
