Option Strict On
Option Explicit On

Imports System
Imports System.Collections.Generic

Namespace Acme.Billing

	''' A worked example that exercises most of the highlight queries.
	<Serializable>
	Public Class Invoice
		Inherits EntityBase
		Implements IComparable(Of Invoice)

		Public Const VatRate As Decimal = 0.2D

		Private ReadOnly _lines As New List(Of InvoiceLine)()
		Private _reference As String = "INV-0000"

		Public Enum Status
			Draft
			Issued
			Paid
		End Enum

		Public Sub New(ByVal reference As String)
			_reference = reference
		End Sub

		Public Property Reference As String
			Get
				Return _reference
			End Get
			Set(value As String)
				_reference = value
			End Set
		End Property

		Public Event Settled As EventHandler

		Public Function Total(Optional includeVat As Boolean = True) As Decimal
			Dim subtotal As Decimal = 0D

			For Each line In _lines
				subtotal += line.Quantity * line.UnitPrice
			Next

			If Not includeVat Then
				Return subtotal
			ElseIf subtotal > 10000D Then
				Return subtotal * (1 + VatRate) * 0.95D
			Else
				Return subtotal * (1 + VatRate)
			End If
		End Function

		Public Sub Describe()
			Dim i As Integer = 0

			Do While i < _lines.Count
				Select Case _lines(i).Category
					Case "goods", "services"
						Console.WriteLine($"{i}: {_lines(i).Description}")
					Case Is > 5
						Console.WriteLine("high")
					Case Else
						Console.WriteLine("other")
				End Select
				i += 1
			Loop

			Try
				Using writer As New IO.StreamWriter("out.txt")
					writer.WriteLine(Reference)
				End Using
			Catch ex As IO.IOException When ex.HResult <> 0
				Throw New ApplicationException("write failed", ex)
			Finally
				Console.WriteLine("done")
			End Try
		End Sub

		Public Function CompareTo(other As Invoice) As Integer _
			Implements IComparable(Of Invoice).CompareTo
			Return String.Compare(Reference, other.Reference, StringComparison.Ordinal)
		End Function

	End Class

	Public Module Helpers

		Public Function IsBlank(value As String) As Boolean
			Return value Is Nothing OrElse value.Trim() = ""
		End Function

	End Module

End Namespace
