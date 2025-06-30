const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

const DB_PATH = process.env.FILE_DB_PATH;

console.log('🔥 FRESH INSTALL - Nuking everything...');

if (DB_PATH && fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('✅ Database deleted');
}

// Clear node_modules
const nodeModules = ['node_modules', 'media-server/node_modules', 'media-viewer/node_modules'];
nodeModules.forEach((dir) => {
  if (fs.existsSync(dir)) {
    console.log(`🗑️  Clearing ${dir}...`);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

console.log('📦 Installing dependencies...');
execSync('npm run deps', { stdio: 'inherit' });

console.log('⚙️  Running setup...');
execSync('npm run setup', { stdio: 'inherit' });

console.log('🎉 Fresh install complete!');
