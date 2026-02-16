# Start development script for Windows PowerShell
# Opens two terminals - one for client and one for server

Write-Host "Starting development environment..." -ForegroundColor Green

# Start client in a new terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev"

# Wait a moment before starting client
Start-Sleep -Seconds 2

# Start server in a new terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"

Write-Host "Development servers started!" -ForegroundColor Green
Write-Host "Server terminal opened" -ForegroundColor Cyan
Write-Host "Client terminal opened" -ForegroundColor Cyan
