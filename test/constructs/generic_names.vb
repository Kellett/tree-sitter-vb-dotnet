Imports System.Collections.Generic
Imports System.Collections.Immutable

Module GenericNames
    Function Empty() As ImmutableArray(Of Integer)
        Return ImmutableArray(Of Integer).Empty
    End Function

    Function Builder() As ImmutableArray(Of String).Builder
        Return ImmutableArray.CreateBuilder(Of String)()
    End Function

    Sub Run()
        Dim make As Func(Of Object) = AddressOf Create(Of Object)
        Dim keys As Dictionary(Of String, Integer).KeyCollection = Nothing
    End Sub

    Function Create(Of T As New)() As T
        Return New T()
    End Function
End Module
