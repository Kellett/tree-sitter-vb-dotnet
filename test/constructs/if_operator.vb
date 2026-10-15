Module IfOperator
    Function Label(nickname As String, name As String) As String
        Return If(nickname, name)
    End Function

    Function Sign(value As Integer) As String
        Return If(value < 0,
                  "negative",
                  "positive")
    End Function
End Module
