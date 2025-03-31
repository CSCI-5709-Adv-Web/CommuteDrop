# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Copy package.json files first (for better caching)
COPY package.json package-lock.json* ./
COPY server/package.json server/package-lock.json* ./server/

# Install dependencies for both frontend and server
RUN npm install
WORKDIR /app/server
RUN npm install
WORKDIR /app

# Copy all project files
COPY . .

# Build the Vite application without TypeScript checking
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Copy built assets and server files
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/package.json ./package.json

# Install production dependencies only
RUN npm install --production

# Expose ports
EXPOSE 80 3001


# Start the server
CMD ["node", "server.js"]