@echo off
chcp 65001 > nul
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

rem --- Node.js ---
where node > nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao esta instalado. Baixe em https://nodejs.org ^(LTS^).
  pause
  exit /b 1
)

rem --- instala e compila, se ainda nao ---
if not exist "node_modules"        call npm install
if not exist "server\node_modules" call npm install --prefix server
if not exist "dist\index.html"     call npm run build
if errorlevel 1 (
  echo [ERRO] Falha ao preparar o aplicativo. Veja as mensagens acima.
  pause
  exit /b 1
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

echo.
echo ============================================================
echo   PRONTO
echo ============================================================
echo.
echo   O Registro da Guarda agora sobe sozinho toda vez que esta
echo   maquina liga, sem precisar de janela aberta.
echo.
echo   Acesse no navegador:  http://localhost:4000
echo   (pode levar uns 10 segundos apos ligar a maquina)
echo.
echo   Para remover o servico depois, use DESINSTALAR-SERVICO.bat
echo.
pause
exit /b 0
