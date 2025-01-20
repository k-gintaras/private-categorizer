# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install a static server to serve the built files
RUN npm install -g serve

# Copy only the built files from the Angular build output
COPY media-viewer/dist/media-viewer/browser ./dist

# Expose port for the server
EXPOSE 5000

# Serve the built files using the static server
CMD ["serve", "-s", "dist", "-l", "5000"]
