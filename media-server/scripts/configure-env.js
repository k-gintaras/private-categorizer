const path = require('path');

// Detect environment
const isDocker = process.env.IS_DOCKER === 'true';

// Define environment variables
const ROOT_DIRECTORY = isDocker ? '/mnt/ssd' : 'D:/Old Files';
const FILE_DB_PATH = path.join(ROOT_DIRECTORY, 'file_paths.db');

// Print variables for shell sourcing
console.log(`
export ROOT_DIRECTORY=${ROOT_DIRECTORY}
export FILE_DB_PATH=${FILE_DB_PATH}
export MEDIA_SERVER_PORT=4000
export SERVER_URL=http://192.168.1.174:4000
`);
