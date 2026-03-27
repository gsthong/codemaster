# Stop any existing processes on port 8000 and 3000
Stop-Process -Name "uvicorn" -ErrorAction SilentlyContinue
Stop-Process -Name "node" -ErrorAction SilentlyContinue

$GROQ_KEY = "REMOVED"
$GEMINI_KEY = "REMOVED"

$env:GROQ_API_KEY = $GROQ_KEY
$env:GEMINI_API_KEY = $GEMINI_KEY

Write-Host "--- Khởi động CodeMaster ---" -ForegroundColor Cyan

# Start Backend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd d:\codemaster_unified\codemaster; `$env:GROQ_API_KEY='$GROQ_KEY'; `$env:GEMINI_API_KEY='$GEMINI_KEY'; uvicorn main:app --reload --port 8000"

# Start Frontend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd d:\codemaster_unified\codemaster\frontend; npm run dev"

Write-Host "Đã bắt đầu Backend (Port 8000) và Frontend (Port 3000) trong cửa sổ mới." -ForegroundColor Green
