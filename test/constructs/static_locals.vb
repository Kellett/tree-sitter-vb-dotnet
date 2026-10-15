Module StaticLocals
    Function NextId() As Integer
        Static counter As Integer = 0
        Static Dim calls As Integer
        calls += 1
        counter += 1
        Return counter
    End Function
End Module
