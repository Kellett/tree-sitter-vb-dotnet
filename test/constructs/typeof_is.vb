Module TypeOfIs
    Function Describe(shape As Object) As String
        If TypeOf shape Is Circle Then Return "circle"
        If TypeOf shape IsNot Square Then Return "not a square"
        Return "square"
    End Function
End Module
