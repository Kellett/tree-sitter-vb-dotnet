Imports System.IO
Imports System.Threading.Tasks

Module AsyncAwait
    Async Function ReadAllAsync(path As String) As Task(Of String)
        Using reader As New StreamReader(path)
            Return Await reader.ReadToEndAsync()
        End Using
    End Function

    Sub Start()
        Dim work = Async Function() Await Task.Delay(10)
        Dim save = Async Sub()
                       Await Task.Delay(10)
                   End Sub
        Dim measure = Function(text As String) As Integer
                          Return text.Length
                      End Function
    End Sub
End Module
