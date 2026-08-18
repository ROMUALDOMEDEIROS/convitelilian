@echo off
chcp 65001 > nul
title Registro da Guarda
cd /d "%~dp0"

echo ============================================================
echo   REGISTRO DA GUARDA
echo ============================================================
echo.

rem --- 1. O Node.js esta instalado? -------------------------------------
where node > nul 2>&1
if errorlevel 1 (
  echo [ERRO] O Node.js nao esta instalado nesta maquina.
  echo.
  echo   Baixe em https://nodejs.org  ^(versao LTS^), instale
  echo   e depois execute este arquivo novamente.
  echo.
  pause
  exit /b 1
)

for /f "delims=" %%v in ('node -v') do set NODEVER=%%v
echo Node.js %NODEVER% encontrado.
echo.

rem --- 2. Primeira vez? Instala as bibliotecas -------------------------
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

rem --- 3. Compila o aplicativo se ainda nao houver versao pronta -------
if not exist "dist\index.html" (
  echo Preparando o aplicativo ^(so na primeira vez, ou apos atualizar^)...
  call npm run build
  if errorlevel 1 goto erro_build
)

rem --- 4. Sobe UM servidor: aplicativo + banco na mesma porta ----------
echo.
echo Ligando o Registro da Guarda...
start "Registro da Guarda - SERVIDOR" cmd /k "npm --prefix server start"

rem espera o servidor responder antes de abrir o navegador
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
