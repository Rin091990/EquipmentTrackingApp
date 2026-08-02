@echo off
setlocal

cd /d "%~dp0.."

start "Equipment Server" cmd /k "cd /d ""%CD%\server"" && npm run dev"
start "Equipment Client" cmd /k "cd /d ""%CD%\client"" && npm start"

echo Started Equipment Tracking server and client.
echo Server: http://localhost:5000
echo Client: http://localhost:3000
