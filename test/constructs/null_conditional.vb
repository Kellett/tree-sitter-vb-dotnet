Module NullConditional
    Function CityOf(customer As Customer) As String
        Return customer?.Address?.City
    End Function

    Sub Notify(handler As EventHandler)
        handler?.Invoke(Nothing, EventArgs.Empty)
    End Sub
End Module
