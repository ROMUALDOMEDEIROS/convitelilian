@echo off
title Registro da Guarda - Subir junto com o Windows
cd /d "%~dp0"

echo ============================================================
echo   SUBIR SOZINHO, SEM SENHA DE ADMINISTRADOR
echo ============================================================
echo.
echo   O Registro da Guarda passa a subir toda vez que ESTE
echo   usuario fizer login no Windows, sem janela aberta e sem
echo   precisar clicar em nada.
echo.
echo   Nada e instalado na maquina: e so um atalho na sua propria
echo   pasta de Inicializacao. Por isso nao pede administrador.
echo.

rem --- 1. Localiza o Node.js ------------------------------------------
call :ACHAR_NODE

where node > nul 2>&1
if errorlevel 1 (
  echo [ERRO] Nao encontrei o Node.js nesta maquina.
  echo.
  echo   Baixe em https://nodejs.org o arquivo "Windows Binary (.zip)"
  echo   64-bit e descompacte em %USERPROFILE%\node
  echo   ^(nao precisa renomear a pasta, nem instalar nada^).
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

rem Anota a pasta do Node para o lancador oculto. O redirecionamento vem
rem antes do echo de proposito: a pasta pode terminar em digito
rem ^(node-v24.19.0-win-x64^) e o cmd leria o "4>" como redirecionamento.
if defined NODE_DIR (
  > "%~dp0node-dir.txt" echo %NODE_DIR%
) else (
  del "%~dp0node-dir.txt" 2>nul
)

rem --- 2. Instala e compila, se ainda nao ------------------------------
if not exist "node_modules" (
  echo Instalando o aplicativo. Isso leva alguns minutos...
  call npm install
  if errorlevel 1 goto erro_preparar
)
if not exist "server\node_modules" (
  echo Instalando o banco de dados...
  call npm install --prefix server --ignore-scripts
  if errorlevel 1 goto erro_preparar
)
if not exist "dist\index.html" (
  echo Preparando o aplicativo...
  call npm run build
  if errorlevel 1 goto erro_preparar
)

rem --- 3. Cria o lancador na pasta de Inicializacao do usuario ---------
set "PASTA_INICIALIZAR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "LANCADOR=%PASTA_INICIALIZAR%\RegistroDaGuarda.vbs"

if not exist "%PASTA_INICIALIZAR%" (
  echo [ERRO] Nao encontrei a pasta de Inicializacao do seu usuario:
  echo        %PASTA_INICIALIZAR%
  pause
  exit /b 1
)

> "%LANCADOR%" echo ' Sobe o Registro da Guarda quando este usuario faz login.
>> "%LANCADOR%" echo ' Criado por INICIAR-COM-O-WINDOWS.bat. Para remover, use
>> "%LANCADOR%" echo ' REMOVER-DO-WINDOWS.bat na pasta do programa.
>> "%LANCADOR%" echo CreateObject("WScript.Shell").Run "wscript.exe ""%~dp0servidor-oculto.vbs""", 0, False

if not exist "%LANCADOR%" (
  echo [ERRO] Nao consegui criar o lancador em:
  echo        %LANCADOR%
  pause
  exit /b 1
)
echo Lancador criado na sua pasta de Inicializacao.
echo.

rem --- 4. Sobe agora tambem, oculto ------------------------------------
echo Ligando o Registro da Guarda...
start "" wscript.exe "%~dp0servidor-oculto.vbs"

echo Aguardando o servidor responder...
set TENTATIVAS=0
:espera
timeout /t 2 /nobreak > nul
set /a TENTATIVAS+=1
node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>nul
if not errorlevel 1 goto pronto
if %TENTATIVAS% lss 15 goto espera

echo.
echo [AVISO] O lancador foi criado, mas o servidor ainda nao respondeu.
echo         O motivo esta em:  %~dp0server\servico.log
echo.
pause
exit /b 1

:pronto
echo.
echo ============================================================
echo   PRONTO - o servidor ja esta no ar
echo ============================================================
echo.
echo   Acesse no navegador:  http://localhost:4000
echo.
echo   Nao ha janela preta para manter aberta: o servidor roda
echo   escondido. A partir do proximo login neste computador,
echo   ele sobe sozinho.
echo.
echo   Outras maquinas da rede acessam por:  http://IP-DESTA-MAQUINA:4000
echo.
echo   Para desfazer, rode REMOVER-DO-WINDOWS.bat
echo.
pause
exit /b 0

:erro_preparar
echo.
echo [ERRO] Falha ao preparar o aplicativo. Veja as mensagens acima.
echo.
pause
exit /b 1

rem ===================================================================
rem  Procura o Node.js: primeiro o PORTATIL (pasta descompactada, sem
rem  instalacao e sem administrador), depois o instalado no sistema.
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
