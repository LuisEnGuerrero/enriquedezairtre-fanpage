#!/bin/sh
set -e

PORT=${PORT:-8080}
export PORT

echo "🚀 Starting app on port $PORT"

node server.js
