' Sobe o servidor do Registro da Guarda SEM janela visível.
' Usado pela Tarefa Agendada criada pelo INSTALAR-SERVICO.bat.
Set fso = CreateObject("Scripting.FileSystemObject")
base = fso.GetParentFolderName(WScript.ScriptFullName)
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = base
' 0 = janela oculta ; False = não espera terminar
sh.Run "cmd /c npm --prefix server start >> ""server\servico.log"" 2>&1", 0, False
