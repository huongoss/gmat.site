# Multi-stage build for Cloud Run
FROM node:20-alpine AS build
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files for workspace
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/

# Clean install to avoid optional dependency issues
RUN rm -rf node_modules package-lock.json && npm install

# Copy source
COPY . .

# Build client and server using npm workspaces
RUN npm run build --workspace=gmat-practice-app-client && npm run build --workspace=gmat-practice-app-server

# Runtime image
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy built artifacts and yarn workspace node_modules
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/client/dist client/dist
COPY --from=build /app/package.json ./
COPY --from=build /app/server/package.json server/
COPY --from=build /app/client/package.json client/

# Expose Cloud Run port
EXPOSE 8080

# Start server (serves API and static client)
CMD ["node", "server/dist/index.js"]