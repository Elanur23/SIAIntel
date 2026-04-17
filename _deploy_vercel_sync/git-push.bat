@echo off
cd "C:\Users\ela19\OneDrive\Desktop\SIAIntel"
"C:\Program Files\Git\bin\git.exe" init
"C:\Program Files\Git\bin\git.exe" add .
"C:\Program Files\Git\bin\git.exe" commit -m "feat: initial commit"
"C:\Program Files\Git\bin\git.exe" branch -M main
"C:\Program Files\Git\bin\git.exe" remote add origin https://github.com/Elanur23/SIAIntel.git
"C:\Program Files\Git\bin\git.exe" push -u origin main
pause
