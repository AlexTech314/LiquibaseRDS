# CodeBuild Lambda Provider - Docker Image

This directory contains a Docker-based AWS Lambda function that triggers CodeBuild projects for Liquibase migrations.

## Architecture

The Lambda function is built as a Docker image using AWS Lambda's container image support. This approach provides several benefits:

- **Flexibility**: Full control over the runtime environment
- **Dependencies**: Easy management of specific AWS SDK versions
- **Performance**: Optimized multi-stage build for smaller image size
- **Maintainability**: Clear separation of build and runtime environments

## Files

- `Dockerfile` - Multi-stage build configuration
- `package.json` - Node.js dependencies and build scripts
- `tsconfig.json` - TypeScript compiler configuration
- `index.ts` - Main Lambda handler implementation
- `.dockerignore` - Files to exclude from Docker build context

## Docker Build Process

1. **Build Stage**: Uses `node:20-alpine` to compile TypeScript
2. **Runtime Stage**: Uses AWS Lambda Node.js 20 base image
3. **Dependencies**: Only production dependencies in final image
4. **Optimization**: Cache cleaning and efficient layering

## Function Features

- **Error Handling**: Comprehensive error logging and build failure details
- **Timeout Management**: Respects Lambda timeout limits with buffer
- **Status Monitoring**: Real-time build status checking with exponential backoff
- **Log Integration**: Fetches CloudWatch logs for debugging failed builds

## Usage

This Lambda function is automatically deployed by the `LiquibaseRDS` construct and triggered via CloudFormation custom resources during stack deployments.

## Environment

- **Runtime**: Node.js 20 (AWS Lambda container)
- **Architecture**: x86_64
- **Memory**: 256 MB (configurable)
- **Timeout**: 15 minutes (configurable)
