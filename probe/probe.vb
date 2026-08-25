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

