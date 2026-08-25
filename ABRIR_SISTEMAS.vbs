'=====================================================================
' SISTEMAS DA GUARDA - abre tudo de uma vez, no Chrome, sem janela.
'
' E um .vbs, e nao um .bat, de proposito: todo .bat pisca a tela preta do
' cmd.exe ao rodar, nem que seja por um instante. O .vbs nao abre janela
' nenhuma -- o Chrome simplesmente aparece com as abas prontas.
'
' ONDE GUARDAR
'   O melhor lugar e UM NIVEL ACIMA da pasta do programa:
'
'     Documents\romualdo\
'       ABRIR_SISTEMAS.vbs        <- aqui
'       convitelilian-main\       <- esta e trocada a cada atualizacao
'
'   Dentro de convitelilian-main ele funciona igual, mas seria apagado
'   toda vez que voce substituisse a pasta por um ZIP novo. Este arquivo
'   se acha sozinho nos dois lugares.
'
' PARA ABRIR SOZINHO NO LOGIN
'   Botao direito -> Enviar para -> Area de trabalho (criar atalho).
'   Depois, Windows+R, digite  shell:startup , Enter, e mova o atalho
'   para dentro dessa pasta.
'=====================================================================

'=====================================================================
' 1. OS SITES - altere aqui
'    Para acrescentar um quarto, copie a linha, mude o numero e inclua a
'    variavel na lista "sites" logo abaixo.
'=====================================================================
site1 = "http://localhost:4000"
site2 = "https://intranet.cmdpii.com/index.php/mapos"
site3 = "http://192.168.0.245:8080/"

sites = Array(site1, site2, site3)

'=====================================================================
' 2. O REGISTRO DA GUARDA
'    So preencha se este arquivo NAO estiver junto da pasta do programa
'    nem dentro dela -- nesses dois casos ele acha sozinho. Serve apenas
'    para religar o servidor se estiver parado; nao achando, os sites
'    abrem do mesmo jeito, em silencio.
'=====================================================================
pastaRegistro = ""

'=====================================================================
' Daqui para baixo nao precisa mexer.
'=====================================================================

Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")

aqui = fso.GetParentFolderName(WScript.ScriptFullName)
lancador = AcharLancador()

' --- garante que o Registro da Guarda esteja no ar ------------------
' Sem isto, a aba do localhost abriria em "Nao e possivel acessar esse
' site" nas vezes em que o servidor estivesse parado.
If lancador <> "" Then
  If Not NoAr(site1) Then
    sh.Run "wscript.exe """ & lancador & """", 0, False
    ' espera ele atender, ate cerca de 20 segundos
    For tentativa = 1 To 20
      WScript.Sleep 1000
      If NoAr(site1) Then Exit For
    Next
  End If
End If

' --- abre tudo numa janela do Chrome, uma aba por site --------------
chrome = AcharChrome()

If chrome <> "" Then
  argumentos = "--new-window"
  For Each s In sites
    argumentos = argumentos & " """ & s & """"
  Next
  sh.Run """" & chrome & """ " & argumentos, 1, False
Else
  ' Chrome nao encontrado: avisa e abre no navegador padrao, para o
  ' vigilante nao ficar sem os sistemas por causa disso.
  MsgBox "Nao encontrei o Google Chrome nesta maquina." & vbCrLf & vbCrLf & _
         "Vou abrir os sistemas no navegador padrao.", _
         vbExclamation, "Sistemas da Guarda"
  For Each s In sites
    sh.Run """" & s & """", 1, False
    WScript.Sleep 500
  Next
End If

'=====================================================================
' Funcoes
'=====================================================================

' Acha o servidor-oculto.vbs, que sobe o Registro da Guarda escondido.
' Procura ao lado deste arquivo (quando ele esta DENTRO da pasta do
' programa) e depois numa subpasta (quando esta um nivel acima). Se
' pastaRegistro estiver preenchido, ele manda.
Function AcharLancador()
  Dim caminhos, p, achado, subpasta
  achado = ""

  If pastaRegistro <> "" Then
    p = fso.BuildPath(pastaRegistro, "servidor-oculto.vbs")
    If fso.FileExists(p) Then achado = p
  End If

  If achado = "" Then
    caminhos = Array( _
      fso.BuildPath(aqui, "servidor-oculto.vbs"), _
      fso.BuildPath(fso.BuildPath(aqui, "convitelilian-main"), "servidor-oculto.vbs"))
    For Each p In caminhos
      If achado = "" Then
        If fso.FileExists(p) Then achado = p
      End If
    Next
  End If

  ' Ultimo caso: uma pasta irma com outro nome, como convitelilian-master
  ' ou registro-guarda. Procura so um nivel, sem vasculhar o disco.
  If achado = "" Then
    On Error Resume Next
    For Each subpasta In fso.GetFolder(aqui).SubFolders
      If achado = "" Then
        p = fso.BuildPath(subpasta.Path, "servidor-oculto.vbs")
        If fso.FileExists(p) Then achado = p
      End If
    Next
    Err.Clear
    On Error GoTo 0
  End If

  AcharLancador = achado
End Function

' Procura o chrome.exe nos lugares onde ele costuma ser instalado, e
' por ultimo pergunta ao registro do Windows, que sabe onde ele esta
' mesmo em instalacao fora do padrao.
Function AcharChrome()
  Dim candidatos, c, achado
  achado = ""
  candidatos = Array( _
    sh.ExpandEnvironmentStrings("%ProgramFiles%\Google\Chrome\Application\chrome.exe"), _
    sh.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"), _
    sh.ExpandEnvironmentStrings("%LocalAppData%\Google\Chrome\Application\chrome.exe"))

  For Each c In candidatos
    If achado = "" Then
      If fso.FileExists(c) Then achado = c
    End If
  Next

  If achado = "" Then
    On Error Resume Next
    c = sh.RegRead("HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe\")
    If Err.Number = 0 And c <> "" Then
      If fso.FileExists(c) Then achado = c
    End If
    Err.Clear
    On Error GoTo 0
  End If

  AcharChrome = achado
End Function

' True quando o endereco responde. Usado so para o localhost.
Function NoAr(url)
  Dim http, respondeu
  respondeu = False
  On Error Resume Next
  Set http = CreateObject("MSXML2.XMLHTTP.6.0")
  http.Open "GET", url, False
  http.Send
  If Err.Number = 0 Then respondeu = (http.Status = 200)
  Err.Clear
  On Error GoTo 0
  NoAr = respondeu
End Function
