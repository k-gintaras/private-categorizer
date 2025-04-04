/**
 * Environment Configuration Script
 *
 * This script reads the .env file from the project root and:
 * 1. Sets up environment variables for the media-server
 * 2. Generates environment.ts for the Angular application
 * 3. Updates docker-compose.yml with correct paths
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

// The expandEnvVariables function needs to be improved
// In setup-env.js - Add this function
function expandEnvVariables(env) {
  const result = {};

  // First, copy all environment variables
  for (const key in env) {
    result[key] = env[key];
  }

  // Now expand variables that reference other variables
  for (const key in result) {
    if (typeof result[key] === 'string') {
      result[key] = result[key].replace(/\${([^}]+)}/g, (match, varName) => {
        return result[varName] || '';
      });
    }
  }

  return result;
}

// After loading dotenv
const env = expandEnvVariables(process.env);

// Use 'env' instead of 'process.env' for expanded variables

// Function to ensure a directory exists
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    console.warn(`Warning: Directory does not exist: ${dir}`);
    // Uncomment to automatically create directories
    // fs.mkdirSync(dir, { recursive: true });
    // console.log(`Created directory: ${dir}`);
  }
};

// Validate important directories
ensureDirectoryExists(env.ROOT_DIRECTORY);

// Create environment.ts for Angular application
const generateAngularEnvironment = () => {
  const outputFilePath = path.join(__dirname, 'media-viewer/src/environments/environment.ts');
  const envConfigFile = `
export const environment = {
  production: false,
  apiBaseUrl: '${env.SERVER_URL}'
};
`;

  fs.writeFileSync(outputFilePath, envConfigFile);
  console.log(`Angular environment file generated at ${outputFilePath}`);
};

// Generate a shell script with exported environment variables for the server
const generateServerEnvironment = () => {
  const outputFilePath = path.join(__dirname, 'server-env.sh');
  let exportCommands = '';

  // Add all environment variables to the export commands
  Object.keys(env).forEach((key) => {
    exportCommands += `export ${key}="${env[key]}"\n`;
  });

  fs.writeFileSync(outputFilePath, exportCommands);
  console.log(`Server environment file generated at ${outputFilePath}`);

  // Make the file executable on Unix systems
  try {
    fs.chmodSync(outputFilePath, '755');
  } catch (error) {
    // Windows doesn't support chmod, so this might fail
    console.log('Note: chmod not supported on this platform');
  }
};

// Update docker-compose.yml with the correct volume paths
const updateDockerCompose = () => {
  const dockerComposePath = path.join(__dirname, 'docker-compose.yml');
  if (!fs.existsSync(dockerComposePath)) {
    console.warn('Warning: docker-compose.yml not found');
    return;
  }

  let dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf8');

  // Replace the hardcoded volume path with environment variable
  dockerComposeContent = dockerComposeContent.replace(/('|")D:\/Old Files('|"):\/mnt\/ssd/g, `'${env.DOCKER_VOLUME_PATH}:/mnt/ssd'`);

  fs.writeFileSync(dockerComposePath, dockerComposeContent);
  console.log(`Updated docker-compose.yml with environment variables`);
};

// Main execution
try {
  generateAngularEnvironment();
  generateServerEnvironment();
  updateDockerCompose();

  console.log('Environment setup completed successfully!');
  console.log('Summary of key environment variables:');
  console.log(`- ROOT_DIRECTORY: ${env.ROOT_DIRECTORY}`);
  console.log(`- SERVER_URL: ${env.SERVER_URL}`);
  console.log(`- MEDIA_SERVER_PORT: ${env.MEDIA_SERVER_PORT}`);
  console.log(`- FILE_DB_PATH: ${env.FILE_DB_PATH}`);
} catch (error) {
  console.error('Error during environment setup:', error);
  process.exit(1);
}
