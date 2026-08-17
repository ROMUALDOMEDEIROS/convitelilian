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
  echo Primeira execucao: instalando a tela. Isso leva alguns minutos...
  call npm install
  if errorlevel 1 goto erro_install
)

if not exist "server\node_modules" (
  echo Primeira execucao: instalando o banco de dados...
  call npm install --prefix server
  if errorlevel 1 goto erro_install
)

rem --- 3. Sobe as duas partes -----------------------------------------
echo.
echo Ligando o banco de dados...
start "Registro da Guarda - BANCO DE DADOS" cmd /k "npm --prefix server start"

rem Espera o servidor responder antes de abrir o navegador. O teste usa o
rem proprio Node (ja verificado acima) em vez de curl, que nao existe em
rem versoes mais antigas do Windows.
echo Aguardando o banco responder...
set TENTATIVAS=0
:espera
timeout /t 2 /nobreak > nul
set /a TENTATIVAS+=1
node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>nul
if not errorlevel 1 goto banco_ok
if %TENTATIVAS% lss 15 goto espera
echo [AVISO] O banco nao respondeu. A tela vai abrir, mas "Salvar no banco"
echo         pode falhar. Veja a janela BANCO DE DADOS para o motivo.
goto sobe_tela

:banco_ok
echo Banco de dados respondendo.

:sobe_tela
echo Ligando a tela...
start "Registro da Guarda - TELA" cmd /k "npm run dev"

echo.
echo ============================================================
echo   PRONTO
echo ============================================================
echo.
echo   Abra o navegador em:  http://localhost:5173
echo.
echo   Abriram-se duas janelas: BANCO DE DADOS e TELA.
echo   MANTENHA AS DUAS ABERTAS enquanto estiver usando.
echo   Para encerrar o servico, feche as duas.
echo.

timeout /t 8 /nobreak > nul
start http://localhost:5173
exit /b 0

:erro_install
echo.
echo [ERRO] A instalacao falhou. Verifique se esta maquina tem acesso
echo        a internet ^(necessario apenas nesta primeira vez^).
echo.
pause
exit /b 1
