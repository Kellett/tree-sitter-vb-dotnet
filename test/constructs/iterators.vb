Imports System.Collections.Generic

Module Iterators
    Iterator Function Evens(limit As Integer) As IEnumerable(Of Integer)
        For i As Integer = 0 To limit
            If i Mod 2 = 0 Then Yield i
        Next
        Yield limit
    End Function

    Function Squares() As Func(Of IEnumerable(Of Integer))
        Return Iterator Function()
                   Yield 1
                   Yield 4
               End Function
    End Function
End Module
