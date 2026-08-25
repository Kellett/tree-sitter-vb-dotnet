Public Class A
	Public Sub M()
		Try
			Using writer As New IO.StreamWriter("out.txt")
				writer.WriteLine(Reference)
			End Using
		Catch ex As IO.IOException When ex.HResult <> 0
			Throw New ApplicationException("boom", ex)
		Finally
			Console.WriteLine("done")
		End Try
	End Sub
End Class
