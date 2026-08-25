Public Class A
	Public Function F() As Decimal
		If Not a Then
			Return b
		ElseIf b > 10000D Then
			Return b * (1 + c) * 0.95D
		Else
			Return b * (1 + c)
		End If
	End Function
End Class
