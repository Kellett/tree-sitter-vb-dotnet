Public Structure Money
    Public Amount As Decimal

    Public Shared Operator +(a As Money, b As Money) As Money
        Return New Money With {.Amount = a.Amount + b.Amount}
    End Operator

    Public Shared Operator =(a As Money, b As Money) As Boolean
        Return a.Amount = b.Amount
    End Operator

    Public Shared Operator <>(a As Money, b As Money) As Boolean
        Return a.Amount <> b.Amount
    End Operator

    Public Shared Widening Operator CType(value As Decimal) As Money
        Return New Money With {.Amount = value}
    End Operator
End Structure
