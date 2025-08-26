@echo off
echo 🎨 Starting Design Inspector API Server...
echo.
echo 📍 API will be available at: http://localhost:3000
echo 🔍 Press Ctrl+C to stop the server
echo.
echo 📦 Building TypeScript...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed! Please check the errors above.
    pause
    exit /b 1
)
echo ✅ Build successful!
echo.
echo 🚀 Starting server...
npm start
pause
