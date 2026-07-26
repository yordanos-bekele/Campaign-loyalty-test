#!/bin/bash

# ============================================
# Development Mode Script
# ============================================

echo "🚀 Starting development mode..."

# Set environment variables for development
export SPRING_PROFILES_ACTIVE=dev
export DB_USERNAME=dev_user
export DB_PASSWORD=dev_password
export LOG_LEVEL=DEBUG

# Rebuild and run
mvn clean package -DskipTests

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Starting application..."
    java -jar target/myapp.jar \
        --spring.profiles.active=dev \
        --logging.level.com.yourcompany=DEBUG
else
    echo "❌ Build failed!"
    exit 1
fi