Module XmlCData
    Function Query() As String
        Dim sql = <sql><![CDATA[
            SELECT Id, Name
            FROM Customers
            WHERE Name LIKE 'A%' AND Total > 100
        ]]></sql>.Value
        Return sql
    End Function
End Module
