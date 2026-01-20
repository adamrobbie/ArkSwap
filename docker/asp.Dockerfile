FROM node:18-slim

# Install pnpm and curl (for healthcheck) and openssl for Prisma
RUN npm install -g pnpm@10.22.0 && \
    apt-get update -y && \
    apt-get install -y curl openssl

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy workspace packages (needed for workspace linking)
COPY packages/ ./packages/
COPY apps/asp/package.json ./apps/asp/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/asp/ ./apps/asp/
COPY packages/ ./packages/

# Build dependencies first, then ASP
RUN pnpm turbo build --filter=@arkswap/asp...

# Expose port
EXPOSE 7070

# Run the application
CMD ["node", "apps/asp/dist/main.js"]

