const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Load environment variables from the .env file
dotenv.config();

const outputFilePath = path.join(__dirname, '../media-viewer/src/environments/environment.ts');

// Access environment variables using bracket notation
const apiBaseUrl = process.env['SERVER_URL'] || 'http://localhost:3000';
console.log('apiBaseUrl');
console.log(apiBaseUrl);

// Generate the `environment.ts` file
const envConfigFile = `
export const environment = {
  production: false,
  apiBaseUrl: '${apiBaseUrl}'
};
`;

fs.writeFileSync(outputFilePath, envConfigFile);
console.log(`Environment file generated at ${outputFilePath}`);
