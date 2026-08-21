@echo off
title Registro da Guarda - Remover servico
cd /d "%~dp0"

net session > nul 2>&1
if errorlevel 1 (
  echo [ATENCAO] Execute como ADMINISTRADOR ^(botao direito, Executar como administrador^).
  pause
  exit /b 1
)

echo Removendo o servico do Registro da Guarda...
schtasks /end    /tn "RegistroDaGuarda" > nul 2>&1
schtasks /delete /tn "RegistroDaGuarda" /f
rem encerra o servidor que estiver rodando oculto
taskkill /f /im node.exe > nul 2>&1
del "%~dp0node-dir.txt" 2>nul

echo.
echo Servico removido. O aplicativo nao sobe mais sozinho.
echo Voce ainda pode usar normalmente com o INICIAR.bat.
pause
exit /b 0
