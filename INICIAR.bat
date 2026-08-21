@echo off
title Registro da Guarda
cd /d "%~dp0"

echo ============================================================
echo   REGISTRO DA GUARDA
echo ============================================================
echo.

call :ACHAR_NODE

where node > nul 2>&1
if errorlevel 1 (
  echo [ERRO] Nao encontrei o Node.js nesta maquina.
  echo.
  echo   Opcao SEM administrador ^(recomendada^):
  echo     1^) Baixe em https://nodejs.org o arquivo "Windows Binary (.zip)" 64-bit
  echo     2^) Descompacte em qualquer uma destas pastas:
  echo          %USERPROFILE%\node
  echo          %~dp0
  echo        A pasta pode ficar com o nome node-v24.19.0-win-x64 mesmo;
  echo        este script encontra do mesmo jeito.
  echo     3^) Rode este arquivo de novo.
  echo.
  echo   Ou peca ao setor de informatica para instalar o Node.js ^(LTS^).
  echo.
  pause
  exit /b 1
)

for /f "delims=" %%v in ('node -v') do set "NODEVER=%%v"
if defined NODE_DIR (
  echo Node.js %NODEVER% encontrado em: %NODE_DIR%
) else (
  echo Node.js %NODEVER% encontrado ^(instalado no sistema^).
)
echo.

rem --- 1. Primeira vez? Instala as bibliotecas -----------------------
if not exist "node_modules" (
  echo Primeira execucao: instalando o aplicativo. Isso leva alguns minutos...
  call npm install
  if errorlevel 1 goto erro_install
)
if not exist "server\node_modules" (
  echo Primeira execucao: instalando o banco de dados...
  rem --ignore-scripts: o banco ja vem com o binario pronto para Windows.
  rem Sem isso, o npm tentaria compilar e exigiria o Visual Studio.
  call npm install --prefix server --ignore-scripts
  if errorlevel 1 goto erro_install
)

rem --- 2. Compila o aplicativo se ainda nao houver versao pronta -----
if not exist "dist\index.html" (
  echo Preparando o aplicativo ^(so na primeira vez, ou apos atualizar^)...
  call npm run build
  if errorlevel 1 goto erro_build
)

rem --- 3. Sobe UM servidor: aplicativo + banco na mesma porta --------
echo.
echo Ligando o Registro da Guarda...
start "Registro da Guarda - SERVIDOR" cmd /k "npm --prefix server start"

echo Aguardando o servidor responder...
set TENTATIVAS=0
:espera
timeout /t 2 /nobreak > nul
set /a TENTATIVAS+=1
node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>nul
if not errorlevel 1 goto pronto
if %TENTATIVAS% lss 20 goto espera
echo [AVISO] O servidor demorou a responder. Abrindo o navegador mesmo assim;
echo         se nao carregar, veja a janela "SERVIDOR" para o motivo.

:pronto
echo.
echo ============================================================
echo   PRONTO
echo ============================================================
echo.
echo   Aplicativo aberto em:  http://localhost:4000
echo.
echo   Abriu UMA janela "SERVIDOR": mantenha-a aberta enquanto
echo   estiver usando. Para encerrar, feche essa janela.
echo.
echo   Outras maquinas da rede acessam por:  http://IP-DESTA-MAQUINA:4000
echo.

timeout /t 2 /nobreak > nul
start http://localhost:4000
exit /b 0

:erro_install
echo.
echo [ERRO] A instalacao falhou. Verifique se esta maquina tem acesso
echo        a internet ^(necessario apenas nesta primeira vez^).
echo.
pause
exit /b 1

:erro_build
echo.
echo [ERRO] Falha ao preparar o aplicativo. Veja as mensagens acima.
echo.
pause
exit /b 1

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
