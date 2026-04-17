@echo off
chcp 65001 >nul
title SIAINTEL - Güvenli Terminal
cd /d "%~dp0"

echo.
echo  SIA_SENTINEL: Sistem Baslatiliyor...
echo  Terminal Uydu Baglantisi: http://localhost:3000/tr
echo.

:: Tarayıcıyı 6 saniye sonra otomatik aç
start /b cmd /c "timeout /t 6 /nobreak >nul && start http://localhost:3000/tr"

:: Sistemi kesin olarak 3000 portunda çalıştır
npx next dev -p 3000
