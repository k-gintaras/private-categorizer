// quick-setup.js
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { execSync } = require('child_process');

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = promisify(readline.question).bind(readline);

class QuickSetup {
  constructor() {
    this.config = {};
  }

  log(message, type = 'info') {
    const icons = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      question: '❓',
    };
    console.log(`${icons[type]} ${message}`);
  }

  async askQuestion(questionText, defaultValue = '') {
    const prompt = defaultValue ? `${questionText} (default: ${defaultValue}): ` : `${questionText}: `;

    const answer = await question(prompt);
    return answer.trim() || defaultValue;
  }

  async detectPaths() {
    this.log('🔍 Detecting common media directories...');

    const commonPaths = [
      'C:\\Users\\Public\\Videos',
      'C:\\Users\\Public\\Pictures',
      'D:\\Videos',
      'D:\\Media',
      process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Videos') : null,
      process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Pictures') : null,
    ].filter(Boolean);

    const existingPaths = commonPaths.filter((p) => fs.existsSync(p));

    if (existingPaths.length > 0) {
      this.log('Found existing media directories:');
      existingPaths.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
      return existingPaths[0]; // Return first found
    }

    return '';
  }

  async getNetworkIP() {
    const os = require('os');
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return 'localhost';
  }

  async gatherConfiguration() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 MEDIA SERVER QUICK SETUP');
    console.log('='.repeat(60));
    console.log('This wizard will help you configure your media server.\n');

    // Detect and suggest paths
    const suggestedPath = await this.detectPaths();

    // Get root directory
    this.config.ROOT_DIRECTORY = await this.askQuestion('📁 Enter the path to your media files', suggestedPath || 'C:\\Users\\Public\\Videos');

    // Validate root directory
    if (!fs.existsSync(this.config.ROOT_DIRECTORY)) {
      const create = await this.askQuestion(`⚠️  Directory doesn't exist. Create it? (y/n)`, 'y');

      if (create.toLowerCase() === 'y') {
        try {
          fs.mkdirSync(this.config.ROOT_DIRECTORY, { recursive: true });
          this.log(`Created directory: ${this.config.ROOT_DIRECTORY}`, 'success');
        } catch (error) {
          this.log(`Failed to create directory: ${error.message}`, 'error');
          process.exit(1);
        }
      } else {
        this.log('Setup cancelled. Please provide a valid directory.', 'error');
        process.exit(1);
      }
    }

    // Set database path
    this.config.FILE_DB_PATH = path.join(this.config.ROOT_DIRECTORY, 'file_paths.db');

    // Get network configuration
    const detectedIP = await this.getNetworkIP();

    const useNetwork = await this.askQuestion('🌐 Allow network access? (y/n)', 'y');

    if (useNetwork.toLowerCase() === 'y') {
      this.config.SERVER_HOST = await this.askQuestion('🖥️  Server host (use detected IP for network access)', detectedIP);
    } else {
      this.config.SERVER_HOST = 'localhost';
    }

    // Get port
    this.config.MEDIA_SERVER_PORT = await this.askQuestion('🔌 Server port', '4001');

    // Set remaining configuration
    this.config.MEDIA_SERVER_HOST = '0.0.0.0';
    this.config.ANGULAR_APP_PORT = '4200';
    this.config.IS_DOCKER = 'false';
    this.config.SERVER_URL = `http://${this.config.SERVER_HOST}:${this.config.MEDIA_SERVER_PORT}`;
    this.config.DOCKER_VOLUME_PATH = this.config.ROOT_DIRECTORY;

    console.log('\n📋 Configuration Summary:');
    console.log(`📁 Media Directory: ${this.config.ROOT_DIRECTORY}`);
    console.log(`🗃️  Database: ${this.config.FILE_DB_PATH}`);
    console.log(`🌐 Server URL: ${this.config.SERVER_URL}`);
    console.log(`🔌 Port: ${this.config.MEDIA_SERVER_PORT}`);
  }

  createEnvFile() {
    const envContent = `# Media Application Environment Configuration

# Base paths and directories
# must use full paths please
# path configuration
IS_DOCKER=${this.config.IS_DOCKER}
DOCKER_VOLUME_PATH=${this.config.DOCKER_VOLUME_PATH}
ROOT_DIRECTORY=${this.config.ROOT_DIRECTORY}
FILE_DB_PATH=${this.config.FILE_DB_PATH}

# Server configuration
MEDIA_SERVER_PORT=${this.config.MEDIA_SERVER_PORT}
MEDIA_SERVER_HOST=${this.config.MEDIA_SERVER_HOST}

# Client configuration
ANGULAR_APP_PORT=${this.config.ANGULAR_APP_PORT}

# Network configuration
# Use 'localhost' for local development or your machine's IP for network access
SERVER_HOST=${this.config.SERVER_HOST}
SERVER_URL=${this.config.SERVER_URL}
`;

    const envPath = path.join(__dirname, '.env');
    fs.writeFileSync(envPath, envContent);
    this.log(`Environment file created: ${envPath}`, 'success');
  }

  async runSetupCommands() {
    this.log('🔧 Running setup commands...');

    const commands = ['npm run setup-env', 'npm run health-check'];

    for (const cmd of commands) {
      try {
        this.log(`Running: ${cmd}`);
        execSync(cmd, { stdio: 'inherit', cwd: __dirname });
        this.log(`✅ ${cmd} completed`);
      } catch (error) {
        this.log(`❌ ${cmd} failed: ${error.message}`, 'error');

        if (cmd.includes('health-check')) {
          this.log('Health check failed - this is normal for first setup', 'warning');
        } else {
          throw error;
        }
      }
    }
  }

  async indexFiles() {
    const shouldIndex = await this.askQuestion('📚 Index media files now? (recommended - y/n)', 'y');

    if (shouldIndex.toLowerCase() === 'y') {
      try {
        this.log('📚 Indexing files... This may take a while.');
        execSync('npm run index-files', { stdio: 'inherit', cwd: __dirname });
        this.log('✅ File indexing completed', 'success');
      } catch (error) {
        this.log(`❌ File indexing failed: ${error.message}`, 'error');
        this.log('You can run "npm run index-files" later', 'warning');
      }
    }
  }

  async installDependencies() {
    const shouldInstall = await this.askQuestion('📦 Install dependencies? (y/n)', 'y');

    if (shouldInstall.toLowerCase() === 'y') {
      try {
        this.log('📦 Installing server dependencies...');
        execSync('npm run setup-server', { stdio: 'inherit', cwd: __dirname });

        this.log('📦 Installing client dependencies...');
        execSync('npm run setup-client', { stdio: 'inherit', cwd: __dirname });

        this.log('✅ Dependencies installed', 'success');
      } catch (error) {
        this.log(`❌ Dependency installation failed: ${error.message}`, 'error');
        this.log('You can run "npm run setup-all" later', 'warning');
      }
    }
  }

  async finalHealthCheck() {
    this.log('🏥 Running final health check...');

    try {
      execSync('npm run health-check', { stdio: 'inherit', cwd: __dirname });
      this.log('✅ Final health check passed!', 'success');
      return true;
    } catch (error) {
      this.log('❌ Health check found issues', 'warning');
      this.log('Review the output above and fix any errors', 'warning');
      return false;
    }
  }

  printNextSteps(healthCheckPassed) {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SETUP COMPLETE!');
    console.log('='.repeat(60));

    if (healthCheckPassed) {
      console.log('✅ Your media server is ready to start!');
      console.log('\n🚀 To start the server:');
      console.log('  npm start                 # Start both server and client');
      console.log('  npm run start-server      # Start only the server');
      console.log('  npm run start-client      # Start only the client');
    } else {
      console.log('⚠️  Setup completed with warnings');
      console.log('\n🔧 To fix issues:');
      console.log('  npm run health-check      # Check what needs fixing');
      console.log('  npm run index-files       # Index your media files');
      console.log('  npm run diagnose          # Get detailed diagnostics');
    }

    console.log('\n🛠️  Other useful commands:');
    console.log('  npm run health-check      # Check system health');
    console.log('  npm run reindex           # Re-scan media files');
    console.log('  npm run validate          # Validate configuration');

    console.log(`\n📁 Your media directory: ${this.config.ROOT_DIRECTORY}`);
    console.log(`🌐 Server will be available at: ${this.config.SERVER_URL}`);
    console.log(`📱 Client will be available at: http://${this.config.SERVER_HOST}:${this.config.ANGULAR_APP_PORT}`);

    console.log('\n' + '='.repeat(60));
  }

  async run() {
    try {
      await this.gatherConfiguration();

      const confirm = await this.askQuestion('\n✅ Proceed with this configuration? (y/n)', 'y');

      if (confirm.toLowerCase() !== 'y') {
        this.log('Setup cancelled by user', 'warning');
        process.exit(0);
      }

      this.createEnvFile();
      await this.runSetupCommands();
      await this.installDependencies();
      await this.indexFiles();

      const healthCheckPassed = await this.finalHealthCheck();
      this.printNextSteps(healthCheckPassed);
    } catch (error) {
      this.log(`Setup failed: ${error.message}`, 'error');
      process.exit(1);
    } finally {
      readline.close();
    }
  }
}

// Main execution
async function main() {
  const setup = new QuickSetup();
  await setup.run();
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
}

module.exports = QuickSetup;
