#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JAR_PATH="$SCRIPT_DIR/target/campaign-loyalty-backend-0.0.1-SNAPSHOT.jar"

if [[ ! -f "$JAR_PATH" ]]; then
    echo "Jar not found at: $JAR_PATH"
    echo "Build the app first with: mvn clean package"
    exit 1
fi

exec java -jar "$JAR_PATH"
