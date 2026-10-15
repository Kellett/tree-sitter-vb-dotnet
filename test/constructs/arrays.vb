Module Arrays
    Private _items() As String

    Sub Run(rows As Integer, cols As Integer)
        Dim grid()() As Integer
        Dim table As Integer()()
        Dim filled = New Integer()() {New Integer() {1, 2}, New Integer() {3}}
        ReDim grid(rows)
        ReDim Preserve grid(0 To rows)
        Dim matrix(,) As Double
        ReDim matrix(rows, cols)
    End Sub

    Sub Grow(n As Integer)
        ReDim Preserve Me._items(n)
    End Sub
End Module
