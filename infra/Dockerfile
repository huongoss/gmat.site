# Multi-stage build for Cloud Run
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies for server and client
COPY server/package*.json server/
COPY client/package*.json client/
RUN npm ci --prefix server && npm ci --prefix client

# Copy source
COPY . .

# Build client and server
RUN npm run build --prefix client && npm run build --prefix server

# Runtime image
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy built artifacts and node_modules
COPY --from=build /app/server/node_modules server/node_modules
COPY --from=build /app/client/node_modules client/node_modules
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/client/dist client/dist

# Expose Cloud Run port
EXPOSE 8080

# Start server (serves API and static client)
CMD ["node", "server/dist/index.js"]