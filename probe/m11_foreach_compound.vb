Public Class A
	Public Function F() As Decimal
		Dim subtotal As Decimal = 0D
		For Each line In _lines
			subtotal += line.Quantity * line.UnitPrice
		Next
		Return subtotal
	End Function
End Class
