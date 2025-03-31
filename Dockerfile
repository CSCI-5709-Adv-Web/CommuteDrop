# Development image
FROM node:18-alpine
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

# Expose both ports
EXPOSE 5173 3001

# Start the development server
# This will run both the frontend on 5173 and websocket server on 3001
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]