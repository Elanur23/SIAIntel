@echo off
echo ========================================
echo  CLEAN CACHE
echo ========================================
echo.

if exist ".next" (
    echo Removing .next/ cache...
    rmdir /s /q ".next"
    echo   Done.
) else (
    echo .next/ not found - OK
)

if exist "node_modules\.cache" (
    echo Removing node_modules/.cache...
    rmdir /s /q "node_modules\.cache"
    echo   Done.
) else (
    echo node_modules/.cache not found - OK
)

if exist ".cache" (
    echo Removing .cache/...
    rmdir /s /q ".cache"
    echo   Done.
) else (
    echo .cache/ not found - OK
)

echo.
echo ========================================
echo  Cache cleaned successfully.
echo ========================================
