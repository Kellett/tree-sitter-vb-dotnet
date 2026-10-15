Imports System.Collections

Module ContextualKeywords
    Function First(items As IEnumerable) As Object
        Dim Iterator As IEnumerator = items.GetEnumerator()
        If Iterator.MoveNext() Then Return Iterator.Current
        Dim async = Iterator
        Return Nothing
    End Function

    Async Function LoadAsync() As Task
        Dim pending = Iterator Function()
                          Yield 1
                      End Function
        Await Task.Delay(1)
    End Function
End Module
