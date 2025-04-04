// inject-docker-env.js
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

// Read the template docker-compose file
const templatePath = path.join(__dirname, 'docker-compose.template.yml');
const outputPath = path.join(__dirname, 'docker-compose.yml');
let template = fs.readFileSync(templatePath, 'utf8');

// Replace placeholders with actual values
template = template.replace(/\$\{ROOT_DIRECTORY\}/g, process.env.ROOT_DIRECTORY);
template = template.replace(/\$\{FILE_DB_PATH\}/g, process.env.FILE_DB_PATH);
template = template.replace(/\$\{MEDIA_SERVER_PORT\}/g, process.env.MEDIA_SERVER_PORT);
template = template.replace(/\$\{SERVER_URL\}/g, process.env.SERVER_URL);
template = template.replace(/\$\{DOCKER_VOLUME_PATH\}/g, process.env.DOCKER_VOLUME_PATH);

// Write the updated docker-compose file
fs.writeFileSync(outputPath, template);
console.log(`Docker Compose file updated with current environment variables`);
