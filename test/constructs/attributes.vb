Imports System.ComponentModel
Imports System.Diagnostics

Public Class Attributes
    <Obsolete("Use Create")>
    <DebuggerStepThrough>
    Public Sub Make()
    End Sub

    <Browsable(False)>
    <Obsolete>
    Public Property Name As String

    <Serializable>
    <DebuggerDisplay("{Name}")>
    Public Class Nested
        <NonSerialized>
        <Obsolete>
        Private _cache As Object
    End Class
End Class
