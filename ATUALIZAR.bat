@echo off
title Registro da Guarda - Atualizar
cd /d "%~dp0"

call :ACHAR_NODE

where node > nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado. Rode o INICIAR.bat primeiro, que ele
  echo        explica como obter o Node sem administrador.
  pause
  exit /b 1
)

echo Recompilando o aplicativo apos uma atualizacao...
echo.
call npm install
call npm install --prefix server --ignore-scripts
rmdir /s /q dist 2>nul
call npm run build
if errorlevel 1 (
  echo.
  echo [ERRO] Falha ao recompilar. Veja as mensagens acima.
  pause
  exit /b 1
)
echo.
echo Pronto. Rode o INICIAR.bat para usar.
pause
exit /b 0

rem ===================================================================
rem  Procura o Node.js: primeiro o PORTATIL (pasta descompactada, sem
rem  instalacao e sem administrador), depois o instalado no sistema.
rem  Aceita a pasta ja renomeada para "node" e tambem a pasta versionada
rem  que o .zip cria sozinho (node-v24.19.0-win-x64), nos lugares onde
rem  as pessoas costumam descompactar.
rem ===================================================================
:ACHAR_NODE
set "NODE_DIR="
call :NODE_TESTA "%~dp0node"
call :NODE_TESTA "%USERPROFILE%\node"
call :NODE_TESTA "%USERPROFILE%\Downloads\node"
call :NODE_TESTA "%USERPROFILE%\Desktop\node"
call :NODE_TESTA "%LOCALAPPDATA%\node"
call :NODE_VERSAO "%~dp0"
call :NODE_VERSAO "%~dp0node\"
call :NODE_VERSAO "%USERPROFILE%\"
call :NODE_VERSAO "%USERPROFILE%\node\"
call :NODE_VERSAO "%USERPROFILE%\Downloads\"
call :NODE_VERSAO "%USERPROFILE%\Desktop\"
if defined NODE_DIR set "PATH=%NODE_DIR%;%PATH%"
goto :eof

:NODE_TESTA
if defined NODE_DIR goto :eof
if exist "%~1\node.exe" set "NODE_DIR=%~1"
goto :eof

:NODE_VERSAO
if defined NODE_DIR goto :eof
for /f "delims=" %%D in ('dir /b /ad "%~1node-v*-win-x64" 2^>nul') do (
  if not defined NODE_DIR if exist "%~1%%D\node.exe" set "NODE_DIR=%~1%%D"
)
goto :eof
