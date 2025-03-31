# # Development image
# FROM node:18-alpine
# WORKDIR /app

# # Copy package.json files first (for better caching)
# COPY package.json package-lock.json* ./
# COPY server/package.json server/package-lock.json* ./server/

# # Install dependencies for both frontend and server
# RUN npm install
# WORKDIR /app/server
# RUN npm install
# WORKDIR /app

# # Copy all project files
# COPY . .

# # Expose both ports
# EXPOSE 5173 3001

# # Start the development server
# # This will run both the frontend on 5173 and websocket server on 3001
# CMD ["npm", "run", "dev:docker"]
# Build stage
# Build Stage
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./
COPY server/package.json server/package-lock.json ./server/

# Install dependencies
RUN npm ci
WORKDIR /app/server
RUN npm ci --omit=dev
WORKDIR /app

# Copy all files
COPY . .

# Build frontend
RUN npm run build

# Production Stage
FROM node:18-alpine

WORKDIR /app

# Install dependencies for the server
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/server/package.json /app/server/package.json
RUN npm install --omit=dev

# Install serve for serving frontend
RUN npm install -g serve

# Copy built frontend assets
COPY --from=build /app/dist /app/dist
COPY --from=build /app/server /app/server

# Create health check endpoint
RUN mkdir -p /app/dist/health && \
    echo "OK" > /app/dist/health/index.html

# Expose ports for both frontend and WebSocket server
EXPOSE 5173 3001

# Start both frontend and WebSocket server
CMD ["sh", "-c", "serve -s dist -l 5173 & node server/websocket-server.js"]
