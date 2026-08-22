@echo off
title Registro da Guarda - Nao subir mais com o Windows
cd /d "%~dp0"

set "LANCADOR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\RegistroDaGuarda.vbs"

if exist "%LANCADOR%" (
  del "%LANCADOR%"
  echo Lancador removido da pasta de Inicializacao.
) else (
  echo Nao havia lancador na pasta de Inicializacao.
)

echo Encerrando o servidor que estiver rodando oculto...
taskkill /f /im node.exe > nul 2>&1

echo.
echo O Registro da Guarda nao sobe mais sozinho no login.
echo Voce ainda pode usar quando quiser com o INICIAR.bat.
echo.
pause
exit /b 0
