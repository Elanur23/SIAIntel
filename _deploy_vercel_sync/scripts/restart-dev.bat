@echo off
echo ========================================
echo  RESTART DEV SERVER
echo ========================================
echo.

:: Step 1: Clean cache
call scripts\clean-cache.bat

echo.
echo Starting dev server...
echo ========================================
npm run dev
