FROM node:20-alpine

WORKDIR /app

# Copy workspace files
COPY package.json ./
COPY packages ./packages
COPY frontend ./frontend

# Install dependencies
RUN npm install --workspace=@jam/frontend

WORKDIR /app/frontend

# Build Next.js app
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
