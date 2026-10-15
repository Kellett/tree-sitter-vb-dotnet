Module Tuples
    Function Split(text As String) As (Head As String, Tail As String)
        Return (text.Substring(0, 1), text.Substring(1))
    End Function

    Function Pair() As (Integer, String)
        Return (count:=1, label:="one")
    End Function
End Module
