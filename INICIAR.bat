@echo off
chcp 65001 > nul
title Registro da Guarda
cd /d "%~dp0"

echo ============================================================
echo   REGISTRO DA GUARDA
echo ============================================================
echo.

rem --- 1. Localiza o Node.js ------------------------------------------
rem Procura primeiro um Node PORTATIL (sem instalacao, sem administrador),
rem depois o Node instalado no sistema. Assim funciona nos dois casos.
call :ACHAR_NODE

where node > nul 2>&1
if errorlevel 1 (
  echo [ERRO] Nao encontrei o Node.js nesta maquina.
  echo.
  echo   Opcao SEM administrador ^(recomendada^):
  echo     1^) Baixe em https://nodejs.org o arquivo "Windows Binary (.zip)" 64-bit
  echo     2^) Descompacte em uma destas pastas:
  echo          %USERPROFILE%\node
  echo          %~dp0node
  echo     3^) Rode este INICIAR.bat de novo.
  echo.
  echo   Ou peca ao setor de informatica para instalar o Node.js ^(LTS^).
  echo.
  pause
  exit /b 1
)

for /f "delims=" %%v in ('node -v') do set NODEVER=%%v
echo Node.js %NODEVER% encontrado.
echo.

rem --- 2. Primeira vez? Instala as bibliotecas -----------------------
if not exist "node_modules" (
  echo Primeira execucao: instalando o aplicativo. Isso leva alguns minutos...
  call npm install
  if errorlevel 1 goto erro_install
)
if not exist "server\node_modules" (
  echo Primeira execucao: instalando o banco de dados...
  call npm install --prefix server
  if errorlevel 1 goto erro_install
)

rem --- 3. Compila o aplicativo se ainda nao houver versao pronta -----
if not exist "dist\index.html" (
  echo Preparando o aplicativo ^(so na primeira vez, ou apos atualizar^)...
  call npm run build
  if errorlevel 1 goto erro_build
)

rem --- 4. Sobe UM servidor: aplicativo + banco na mesma porta --------
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
echo   Abriu UMA janela "SERVIDOR" — mantenha-a aberta enquanto
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
rem  Coloca a pasta do Node PORTATIL no PATH desta sessao, se existir.
rem  Aceita a pasta direta (node\node.exe) ou a subpasta versionada que
rem  o .zip do Node cria (node-vXX.XX.X-win-x64\node.exe).
rem ===================================================================
:ACHAR_NODE
set "NODE_DIR="
for %%D in ("%~dp0node" "%USERPROFILE%\node" "%USERPROFILE%\Downloads\node") do (
  if exist "%%~D\node.exe" set "NODE_DIR=%%~D"
)
if not defined NODE_DIR (
  for /d %%D in ("%~dp0node\node-v*-win-x64" "%USERPROFILE%\node\node-v*-win-x64" "%USERPROFILE%\Downloads\node-v*-win-x64") do (
    if exist "%%~D\node.exe" set "NODE_DIR=%%~D"
  )
)
rem A janela do servidor aberta com "start" herda este PATH automaticamente.
if defined NODE_DIR set "PATH=%NODE_DIR%;%PATH%"
goto :eof
