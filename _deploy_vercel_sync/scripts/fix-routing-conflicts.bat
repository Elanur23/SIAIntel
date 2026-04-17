@echo off
echo ========================================
echo  FIX ROUTING CONFLICTS
echo ========================================
echo.

:: Remove known conflicting route directories
if exist "app\news\[slug]" (
    echo Removing app\news\[slug]...
    rmdir /s /q "app\news\[slug]"
    echo   Done.
) else (
    echo app\news\[slug] not found - OK
)

if exist "app\[lang]\news\[id]" (
    echo Removing app\[lang]\news\[id]...
    rmdir /s /q "app\[lang]\news\[id]"
    echo   Done.
) else (
    echo app\[lang]\news\[id] not found - OK
)

echo.
echo ========================================
echo  Routing conflicts resolved.
echo ========================================
