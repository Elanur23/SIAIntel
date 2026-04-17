# CONSTRAINED-PRODUCTION CONTAINER IMAGE
# Phase 3 Validation Campaign - Official Batch Execution Surface
#
# SECURITY: Secrets injected via Kubernetes, NOT baked into image
# SCOPE: Groq-only rail, locked campaign rules, zero-trust enforcement preserved

# Stage 1: Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# ADD BUILD TOOLS (MANDATORY)
RUN apk add --no-cache python3 make g++

# Install production dependencies only
RUN npm pkg delete scripts.prepare && npm ci --omit=dev

# Stage 2: Builder (if build step needed)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Note: Next.js build not required for batch execution
# Batch execution uses tsx to run TypeScript directly

# Stage 3: Runner
FROM node:20-alpine AS runner

WORKDIR /app

# Install tsx globally for TypeScript execution
RUN npm install -g tsx

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy package.json for runtime
COPY package*.json ./

# Copy tsconfig.json for tsx
COPY tsconfig.json ./

# Copy source code (required for batch execution)
COPY lib ./lib
COPY scripts ./scripts
COPY app ./app
COPY components ./components
COPY contexts ./contexts
COPY public ./public

# Set production environment (will be overridden by Kubernetes)
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN mkdir -p /app/data /app/validation-output && chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port (not used for batch execution, but good practice)
EXPOSE 3000

# Default command (will be overridden by Kubernetes job manifest)
CMD ["node", "--version"]
