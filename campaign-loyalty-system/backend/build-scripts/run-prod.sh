#!/bin/bash
# Quick script to run in prod mode

# Set production environment variables
export SPRING_PROFILES_ACTIVE=prod
export DB_USERNAME=prod_user
export DB_PASSWORD=${DB_PASSWORD}  # Must be set externally

# Additional production JVM options
export JAVA_OPTS="-Xmx1024m -Xms512m"

# Run with production profile
java -jar target/myapp.jar \
    --spring.profiles.active=prod \
    ${JAVA_OPTS}