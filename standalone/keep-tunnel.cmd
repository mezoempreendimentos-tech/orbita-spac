@echo off
set NGROK=C:\Tools\ngrok\ngrok.exe
set DOMAIN=blurred-scant-cried.ngrok-free.dev
set PORT=3000
:loop
tasklist /FI "IMAGENAME eq ngrok.exe" 2>NUL | find /I /N "ngrok.exe">NUL
if "%ERRORLEVEL%"=="1" (
  echo [%date% %time%] tunnel_down - religando %DOMAIN% -> %PORT%
  start "" "%NGROK%" http --domain=%DOMAIN% %PORT% --log=stdout
)
timeout /t 30 /nobreak >NUL
goto loop
