' Sobe o servidor do Registro da Guarda SEM janela visivel.
' Usado pelo INICIAR-COM-O-WINDOWS.bat (pasta de Inicializacao do usuario) e
' pela Tarefa Agendada criada pelo INSTALAR-SERVICO.bat.
'
' A Tarefa Agendada roda como SYSTEM, que tem um PATH diferente do seu usuario
' e nao enxerga um Node.js portatil descompactado dentro da sua pasta. Por isso
' o instalador anota a pasta do Node em node-dir.txt e este script a coloca no
' PATH antes de subir o servidor.
'
' ATENCAO ao mexer aqui: "log" e palavra reservada do VBScript (a funcao
' logaritmo), e usa-la como variavel derruba o script inteiro com
' "Atribuicao invalida: 'log'". O mesmo vale para nomes como "date", "time",
' "left", "right" e "string". Por isso a variavel abaixo chama-se arqLog.

Set fso = CreateObject("Scripting.FileSystemObject")
base = fso.GetParentFolderName(WScript.ScriptFullName)
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = base

nodeDir = ""
cfg = fso.BuildPath(base, "node-dir.txt")
If fso.FileExists(cfg) Then
  Set f = fso.OpenTextFile(cfg, 1)
  If Not f.AtEndOfStream Then nodeDir = Trim(f.ReadLine)
  f.Close
End If

arqLog = """" & fso.BuildPath(base, "server\servico.log") & """"
linha = "npm --prefix server start >> " & arqLog & " 2>&1"
If nodeDir <> "" Then
  linha = "set ""PATH=" & nodeDir & ";%PATH%"" && " & linha
End If

' 0 = janela oculta ; False = nao espera terminar
sh.Run "cmd /c " & linha, 0, False
