#!/bin/bash

# Start development script
# Opens two terminals - one for client and one for server

echo "Starting development environment..."

# Start client in a new terminal
start "Client" bash -c "cd client && npm run dev; exec bash"

# Wait a moment before starting client
sleep 2

# Start server in a new terminal
start "Server" bash -c "cd server && npm run dev; exec bash"

echo "Development servers started!"
echo "Server terminal opened"
echo "Client terminal opened"
