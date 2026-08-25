Public Class A
	Public Sub M()
		Do While i < n
			Select Case k
				Case "a", "b"
					Console.WriteLine(i)
				Case Is > 5
					Console.WriteLine("high")
				Case Else
					Console.WriteLine("other")
			End Select
			i += 1
		Loop
	End Sub
End Class
