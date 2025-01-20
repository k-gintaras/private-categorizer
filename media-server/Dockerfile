# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first to cache dependencies
COPY ./package.json /app/

# Install dependencies (including dotenv)
RUN npm install


# Copy all project files into the container
COPY . /app

# Install SQLite for the database
RUN apk add --no-cache sqlite

# Expose the server port
EXPOSE 4000

# Start the server
CMD ["node", "/app/server.js"]
