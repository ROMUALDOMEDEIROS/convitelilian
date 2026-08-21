@echo off
title Registro da Guarda - Instalar servico
cd /d "%~dp0"

echo ============================================================
echo   INSTALAR O REGISTRO DA GUARDA COMO SERVICO
echo   (sobe sozinho quando a maquina liga, sem janela aberta)
echo ============================================================
echo.

rem --- precisa de administrador ---
net session > nul 2>&1
if errorlevel 1 (
  echo [ATENCAO] Este instalador precisa ser executado como ADMINISTRADOR.
  echo.
  echo   Feche esta janela, clique com o botao DIREITO em
  echo   INSTALAR-SERVICO.bat e escolha "Executar como administrador".
  echo.
  pause
  exit /b 1
)

rem --- Node.js: portatil ou instalado ---
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
echo Node.js %NODEVER% encontrado.

rem Grava onde o Node esta, para o servico ^(que roda como SYSTEM, com
rem outro PATH^) conseguir encontra-lo na hora de subir. O redirecionamento
rem vem antes do echo de proposito: "echo %%NODE_DIR%%> arquivo" com a pasta
rem terminando em digito ^(node-v24.19.0-win-x64^) faria o cmd ler o "4>" como
rem redirecionamento de handle, e nao como parte do caminho.
if defined NODE_DIR (
  > "%~dp0node-dir.txt" echo %NODE_DIR%
  echo Pasta do Node anotada para o servico: %NODE_DIR%
) else (
  del "%~dp0node-dir.txt" 2>nul
)
echo.

rem --- instala e compila, se ainda nao ---
if not exist "node_modules" (
  echo Instalando o aplicativo...
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

rem --- cria a tarefa que sobe o servidor ao ligar a maquina, oculto ---
schtasks /create /tn "RegistroDaGuarda" /tr "wscript.exe \"%~dp0servidor-oculto.vbs\"" /sc onstart /ru SYSTEM /rl highest /f
if errorlevel 1 (
  echo [ERRO] Nao foi possivel criar o servico.
  pause
  exit /b 1
)

rem --- inicia agora tambem ---
schtasks /run /tn "RegistroDaGuarda" > nul 2>&1

echo Aguardando o servidor responder...
set TENTATIVAS=0
:espera
timeout /t 2 /nobreak > nul
set /a TENTATIVAS+=1
node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>nul
if not errorlevel 1 goto pronto
if %TENTATIVAS% lss 15 goto espera

echo.
echo [AVISO] O servico foi criado, mas o servidor ainda nao respondeu.
echo         Veja o motivo em:  %~dp0server\servico.log
echo.
pause
exit /b 1

:pronto
echo.
echo ============================================================
echo   PRONTO - o servidor ja esta no ar
echo ============================================================
echo.
echo   O Registro da Guarda agora sobe sozinho toda vez que esta
echo   maquina liga, sem precisar de janela aberta.
echo.
echo   Acesse no navegador:  http://localhost:4000
echo.
echo   Outras maquinas da rede acessam por:  http://IP-DESTA-MAQUINA:4000
echo.
echo   Para remover o servico depois, use DESINSTALAR-SERVICO.bat
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
