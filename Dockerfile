# Production stage
FROM node:20-alpine

WORKDIR /app

# Install system dependencies for performance
RUN apk add --no-cache dumb-init

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /app/uploads /app/public /app/logs && \
    chown -R nodejs:nodejs /app

USER nodejs

# Increase Node.js memory and performance flags
ENV NODE_OPTIONS="--max-old-space-size=1536 --max-semi-space-size=128"

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application with dumb-init for proper signal handling
CMD ["dumb-init", "--", "node", "index.js"]
