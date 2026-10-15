Module Strings
    Function Describe(name As String, total As Decimal) As String
        Dim banner = "first line
second line"
        Dim braces = $"{{literal}} {name}"
        Dim aligned = $"{name,-10}|{total,8:N2}"
        Dim possessive = $"{name}'s total"
        Dim report = $"Name: {name}
Total: {total:C}"
        Return banner & braces & aligned & possessive & report
    End Function
End Module
