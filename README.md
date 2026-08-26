# tree-sitter-vb-dotnet (fork)

Tree-sitter grammar for **Visual Basic .NET**.

A fork of [CodeAnt-AI/tree-sitter-vb-dotnet](https://github.com/CodeAnt-AI/tree-sitter-vb-dotnet)
with fixes that take the parse rate on real-world VB.NET from **7% to 93%**, measured over
4,151 files (2.3M lines) from a production ASP.NET WebForms codebase.

Used by the [VB.NET extension for Zed](https://github.com/Kellett/zed-vb-dotnet).

These changes have been offered upstream. If they are merged, this fork will be archived.

## What was fixed

### Keywords were invisible to tree-sitter queries

Keywords were built as `token(prec(1, ci(word)))`, where `ci()` returns a case-insensitive
regex. Tree-sitter compiles regex-derived tokens to *hidden* tokens, which never appear in
the syntax tree, so no query could ever capture `Class`, `Sub`, `End`, `If` or `Dim`. You
can confirm this on upstream by checking `src/node-types.json`: the only anonymous nodes
are punctuation.

This made syntax highlighting impossible, which is likely why no editor integration
existed. Keyword tokens are now aliased to stable names, so a query can match `"Class"`,
`"End"` and so on. Case-insensitivity is unchanged: `end sub`, `End Sub` and `END SUB` all
parse, and all produce nodes named `End` and `Sub`.

### Generics didn't parse

`type_argument_list` and `type_parameters` were missing their parentheses entirely, so
`As List(Of String)` and `Class Foo(Of T)` were syntax errors.

Deciding whether `(` opens a type argument list or an ordinary argument list needs two
tokens of lookahead, which LR(1) cannot do, so `(Of` is now a single lexer token.

### Identifiers beginning with a keyword broke

Explicit token precedence beat longest-match, so `subtotal` lexed as `Sub` + `To` + `tal`.
Separately, `REM` matched without a word boundary, so `RemoveAt(1)` was swallowed as a
comment. Fixed with a `word` token for keyword extraction, and a boundary on `REM`.

### Missing syntax

| Construct | |
| --- | --- |
| `Inherits Base` / `Implements IFoo` on their own line | added |
| `Dim x As New Foo()`, `Using w As New StreamWriter(...)` | added |
| Nested types (`Enum`/`Class` inside a `Class`) | added |
| `Function F() As T Implements IX.F` | added |
| `Sub Button_Click(...) Handles Button.Click` | added |
| `RaiseEvent` / `AddHandler` / `RemoveHandler` statements | added |
| `.Member` access inside a `With` block | added |
| `Dim v(n - 1) As String` array bounds | added |
| `If x Then a Else b`, including nesting | added |
| `New List(Of T) From { ... }` | added |
| `Imports CColor = System.Drawing.Color` | added |
| `As Double?` nullable types | added |
| `Select expr` without `Case` | added |
| Generic method calls `Foo(Of T)(args)` | added |
| Omitted arguments `Foo(, True)` | added |
| Multi-line `{ }` initialisers | added |
| UTF-8 BOM | handled |
| Blank lines in file headers, property bodies, `Select Case` | tolerated |
| `#Region` at file, namespace and member level | tolerated |

## Deliberate trade-offs

**`field_declaration` now requires modifiers.** A bare `Dim x As T` matched both
`field_declaration` and `dim_statement`, and the parser resolved entire method bodies away
in favour of a bodyless method followed by fields. Member-level `Dim` still works, via
`dim_statement`.

**A type as a call argument is not supported.** `CType(x, Dictionary(Of String, Foo))`
does not parse. Allowing it made type names and expressions ambiguous and cost 6% accuracy
across the corpus, so it was reverted.

## Not implemented

- LINQ query syntax (`From x In xs Where ... Select ...`)
- XML literals
- Preprocessor directives parse as opaque trivia rather than being interpreted

These account for most of the remaining 7%.

A file with no trailing newline produces a zero-width `MISSING` node at end of file, since
block rules require a terminator. It is harmless for highlighting; a proper fix needs an
external scanner.

## Building

```sh
npm install
npx tree-sitter generate
npx tree-sitter test
npx tree-sitter parse examples/sample.vb
```

`src/parser.c` is committed, because Zed and most other consumers compile it directly
rather than running `tree-sitter generate`. **Regenerate and commit it with any change to
`grammar.js`.**

## Testing against your own code

The parse rate above was measured by pointing the parser at a whole codebase:

```sh
ls /path/to/your/code/**/*.vb > paths.txt
npx tree-sitter parse --paths paths.txt --quiet --stat
```

If you hit a construct that doesn't parse, an issue with a minimal repro is very welcome.

## Licence

MIT. See [LICENSE](LICENSE).

Upstream declares MIT in `package.json`, `Cargo.toml`, `pyproject.toml` and
`tree-sitter.json` but ships no licence file; this fork adds the text, preserving the
original copyright.
