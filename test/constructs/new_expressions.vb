Imports System.Collections.Generic
Imports System.IO

Module NewExpressions
    Private ReadOnly Lock As New Object()

    Sub Run(path As String)
        Using writer As New StreamWriter(path, True)
        End Using
        Dim box = New Box(1) With {.Label = "one"}
        Dim boxes = New Box(2) {}
        Dim pair = New Box() {New Box(1), New Box(2)}
        Dim names = New List(Of String)(4) From {"a"}
    End Sub
End Module
