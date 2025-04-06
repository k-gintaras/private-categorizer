# Environment Configuration Implementation Guide

## Beware of shared components

as they are currently separate library you have to clone and compile
you have to add it to tsconfig: "C:/Users/Ubaby/AngularProjects/component-heaven/component-heaven/dist/shared-components"
or wherever that is

This guide will help you centralize your environment configuration for the media server and viewer application.

## 1. Create Central .env File

First, create a `.env` file in the project root with all configuration in one place:

1. Copy the provided `.env` file to your project root.
2. Update the values to match your environment (paths, IP addresses, ports).

## 2. Install Required Packages

Make sure you have the needed dependencies installed:

```bash
# In project root
npm install dotenv
npm install concurrently

# In media-server folder
cd media-server
npm install dotenv
```

## 3. Implement Setup Script

1. Copy the provided `setup-env.js` script to your project root.
2. This script will:
   - Read values from the `.env` file
   - Generate Angular environment files
   - Create a server environment script
   - Update Docker Compose configuration
   - Create server configuration scripts

## 4. Update Package.json Scripts

Update your package.json files to incorporate the setup script:

1. Add the setup-env script to your root package.json:

   ```json
   "scripts": {
     "setup-env": "node setup-env.js",
     "start-server": "npm run setup-env && cd media-server && npm start",
     "start-client": "npm run setup-env && cd media-viewer && npm start",
     "start": "npm run setup-env && concurrently \"npm run start-server\" \"npm run start-client\"",
     "docker-build": "npm run setup-env && docker-compose build",
     "docker-up": "npm run setup-env && docker-compose up"
   }
   ```

2. Simplify the media-server package.json scripts to rely on environment variables.
3. Simplify the media-viewer package.json scripts to rely on environment variables.

## 5. Update Docker Compose File

Replace your existing docker-compose.yml with the provided one that uses environment variables.

## 6. Usage

Now you can run your applications with simple commands:

- For development:

  ```bash
  npm run start
  ```

- For Docker:
  ```bash
  npm run docker-build
  npm run docker-up
  ```

## 7. Making Changes

When you need to change a configuration value:

1. Update the central `.env` file
2. Run the setup script with `npm run setup-env`
3. Restart your applications

## Troubleshooting

- **Missing environment variables**: Check if your `.env` file is correctly formatted
- **Path issues**: Verify that all paths in the `.env` file are valid and accessible
- **Docker volume errors**: Ensure the paths in `DOCKER_VOLUME_PATH` are correctly mapped

## Benefits of this Approach

- Single source of truth for all configuration
- Easy to change environment settings
- Consistent configuration across development and production
- No hardcoded values in source code
- Better security by keeping sensitive information in the .env file
