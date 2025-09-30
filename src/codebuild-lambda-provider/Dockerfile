# Multi-stage build for efficient Docker image
# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /build

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for TypeScript)
RUN npm ci

# Copy source code
COPY *.ts ./

# Compile TypeScript
RUN npm run build

# Stage 2: Runtime stage
FROM public.ecr.aws/lambda/nodejs:20

# Copy package.json for production dependencies
COPY package*.json ${LAMBDA_TASK_ROOT}/

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy compiled JavaScript from builder stage
COPY --from=builder /build/*.js ${LAMBDA_TASK_ROOT}/

# Set the CMD to your handler
CMD [ "index.handler" ]
