# CodeMaster Environment Setup
# Use this script to set your API keys and start the backend

$GROQ_KEY = Read-Host "Enter your GROQ API KEY"
$GEMINI_KEY = Read-Host "Enter your GEMINI API KEY"

if ($GROQ_KEY) {
    $env:GROQ_API_KEY = $GROQ_KEY
}
if ($GEMINI_KEY) {
    $env:GEMINI_API_KEY = $GEMINI_KEY
}

Write-Host "--- Environment Configured ---" -ForegroundColor Green
Write-Host "Starting Backend on port 8000..."

uvicorn main:app --reload --port 8000
