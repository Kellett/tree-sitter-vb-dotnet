Public Class Counter
    Public Event Changed As EventHandler
    Private _value As Integer

    Public Sub Increment(notify As Boolean)
        _value += 1
        If notify Then RaiseEvent Changed(Me, EventArgs.Empty)
    End Sub
End Class
