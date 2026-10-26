' Double-click to open Eudora without a console window.
' Right-click this file > Send to > Desktop (create shortcut) to get a desktop icon.
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = dir
exe = dir & "\node_modules\electron\dist\electron.exe"
If Not fso.FileExists(exe) Then
  MsgBox "Run 'npm install' in this folder once first.", 48, "Eudora"
Else
  sh.Run """" & exe & """ """ & dir & """", 1, False
End If
