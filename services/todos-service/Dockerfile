FROM node:20-alpine

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy root package files and tsconfig
COPY package*.json tsconfig.base.json ./

# Copy all packages (shared dependencies)
COPY packages ./packages
# Copy package tsconfig files
COPY packages/database-engine/tsconfig.json ./packages/database-engine/
COPY packages/base-app/tsconfig.json ./packages/base-app/

# Copy the specific service
COPY services/todos-service ./services/todos-service

# Install dependencies for the entire workspace
RUN npm install

# Build packages first
RUN npm run build --workspace=packages/database-engine --if-present
RUN npm run build --workspace=packages/base-app --if-present
RUN npm run build --workspace=packages/grpc-protos --if-present

# Build the todos service
RUN npm run build --workspace=services/todos-service --if-present

# Remove build dependencies to reduce image size
RUN apk del python3 make g++

# Set working directory to the service
WORKDIR /app/services/todos-service

# Expose HTTP and gRPC ports
EXPOSE 3002 50052

# Start the service
CMD ["node", "dist/app.js"]
