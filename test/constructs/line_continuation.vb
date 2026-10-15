Imports System.Collections.Generic

Module LineContinuation
    Event Changed As EventHandler

    Function Total(price As Decimal, tax As Decimal, discount As Decimal) As Decimal
        Dim subtotal = price +
                       tax
        Dim result =
            subtotal - discount
        result *=
            1
        Return (
            result
        )
    End Function

    Sub Report(
        value As Integer,
        names As List(Of String)
    )
    End Sub

    Sub Run(items As List(Of String))
        Dim names = New List(Of String) From
            {"a", "b"}
        Dim count = items.
            Count
        Report(
            count, ' how many
            names
        )
        Report(value:=
                   count, names:=names)
        AddHandler Changed,
            AddressOf OnChanged
    End Sub

    Sub OnChanged(sender As Object, e As EventArgs)
    End Sub
End Module
