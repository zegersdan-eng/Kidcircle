#!/bin/bash

# KidCircle Production Launch Script
# Ensures port 3000 is clear and the server runs in the background.

PORT=3000
SERVER_DIR="/home/team/shared/kidcircle/server"
LOG_FILE="$SERVER_DIR/server.log"

echo "[$(date)] Starting KidCircle Launch Sequence..."

# 1. Clear any existing process on the port
echo "Cleaning up port $PORT..."
fuser -k $PORT/tcp 2>/dev/null || true
# Fallback if fuser is missing
PIDS=$(lsof -t -i:$PORT)
if [ ! -z "$PIDS" ]; then
    echo "Killing existing processes on port $PORT: $PIDS"
    kill -9 $PIDS 2>/dev/null || true
fi

# 2. Change to server directory
cd $SERVER_DIR

# 3. Ensure client is built (if dist is missing)
if [ ! -d "../client/dist" ]; then
    echo "Client dist missing. Building client..."
    cd ../client && npm run build
    cd $SERVER_DIR
fi

# 4. Launch the server
echo "Launching server..."
nohup npm start >> "$LOG_FILE" 2>&1 &

# 4. Wait a moment and verify
sleep 3
if lsof -i:$PORT > /dev/null; then
    echo "SUCCESS: KidCircle is live on port $PORT"
else
    echo "FAILURE: Server failed to start. Check $LOG_FILE"
    exit 1
fi
