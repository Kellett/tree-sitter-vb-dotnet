/**
 * @file Tree sitter grammar for VB.NET
 * @author CodeAnt AI <chinmay@codeant.ai>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Tree-sitter grammar for Visual Basic .NET, based on the official VB.NET language specification.
// A comma, and the line break an implicit continuation may put after it (spaces or a comment may come first).
const COMMA = token(seq(',', optional(seq(/[ \t]*/, optional(seq("'", /[^\r\n]*/)), /\r?\n/))));

module.exports = grammar({
  name: 'vb_dotnet',

  // Keyword extraction: without this, prec(1) on the keyword tokens beats
  // longest-match, so `subtotal` lexes as Sub + To + tal.
  word: $ => $._word_identifier,


  extras: $ => [
    $.comment,
    /[ \t\f\u00A0\uFEFF]+/,  // whitespace except newlines (incl. UTF-8 BOM)
    $._line_continuation    
  ],

  
  conflicts: $ => [
    [$.type, $.invocation],
    [$.type] ,
    [$.new_expression] ,
    [$.type_argument_list] ,
    [$.property_declaration] ,
    [$.constructor_declaration],
    [$.method_declaration],
    [$.left_hand_side, $.expression],
    [$.label_statement, $.expression],
    [$.event_declaration],
    [$.if_statement],
    [$.type, $.array_type],
    [$.if_statement, $.binary_expression],
    [$.empty_statement, $.if_statement],
    [$.namespace_name, $.attribute],
    [$.namespace_name],
    [$.re_dim_clause, $.argument],
  ],

  rules: {
    
    source_file: $ => seq(
    repeat(choice(
      $.option_statement,
      $.imports_statement,
      seq($.attribute_block, optional($._terminator)),
      $.namespace_block,
      $.type_declaration,
      seq($.preprocessor_directive, $._terminator),
      alias($._terminator, $.blank_line)
    ))
  ),

    
    option_statement: $ => (
      seq(
        kw('Option'),
        choice(
          seq(kw('Explicit'), choice(kw('On'), kw('Off'))),
          seq(kw('Strict'), choice(kw('On'), kw('Off'))),
          seq(kw('Infer'), choice(kw('On'), kw('Off'))),
          seq(kw('Compare'), choice(kw('Binary'), kw('Text')))
        ),
        $._terminator
      )
    ),

    // Imports statement for namespace imports (can import multiple namespaces in one line)
    imports_statement: $ => seq(
      kw('Imports'),
      commaSep1(choice(
        seq(field('alias', $.identifier), '=', field('namespace', $.namespace_name)),
        field('namespace', $.namespace_name)
      )),
      $._terminator
    ),

    // A dot-separated name (for namespaces or qualified types)
    namespace_name: $ => seq($.identifier, repeat(seq('.', $.identifier))),

    // Any top-level type or namespace declaration
    type_declaration: $ => choice(
      $.class_block,
      $.module_block,
      $.structure_block,
      $.interface_block,
      $.enum_block,
      $.delegate_declaration
    ),

    // Namespace block: Namespace Name ... End Namespace
    // namespace_block: $ => seq(
    //   kw('Namespace'),
    //   field('name', $.namespace_name),
    //   $._terminator,
    //   repeat(choice($.attribute_block, $.type_declaration, $.namespace_block)),
    //   kw('End'), kw('Namespace'), $._terminator
    // ),
    namespace_block: $ => seq(
      kw('Namespace'),
      field('name', $.namespace_name),
      $._terminator,
      repeat(choice(
        seq($.attribute_block, optional($._terminator)),
        $.type_declaration, 
        $.namespace_block,
        $.imports_statement,  // Allow imports inside namespace
        seq($.preprocessor_directive, $._terminator),
        alias($._terminator, $.blank_line)  // Allow blank lines
      )),
      kw('End'), kw('Namespace'), $._terminator
    ),

    // Class definition block
    class_block: $ => seq(
      field('modifiers', optional($.modifiers)),
      kw('Class'),
      field('name', $.identifier),
      optional($.type_parameters),
      optional(field('inherits', $.inherits_clause)),
      optional(field('implements', $.implements_clause)),
      $._terminator,
      repeat($._member_declaration),
      kw('End'), kw('Class'), $._terminator
    ),

    // Module definition block
    module_block: $ => seq(
      field('modifiers', optional($.modifiers)),
      kw('Module'),
      field('name', $.identifier),
      $._terminator,
      repeat($._member_declaration),
      kw('End'), kw('Module'), $._terminator
    ),

    // Structure definition block
    structure_block: $ => seq(
      field('modifiers', optional($.modifiers)),
      kw('Structure'),
      field('name', $.identifier),
      optional($.type_parameters),
      optional(field('implements', $.implements_clause)),
      $._terminator,
      repeat($._member_declaration),
      kw('End'), kw('Structure'), $._terminator
    ),

    // Interface definition block
    interface_block: $ => seq(
      field('modifiers', optional($.modifiers)),
      kw('Interface'),
      field('name', $.identifier),
      optional($.type_parameters),
      optional(field('inherits', $.inherits_clause)), // interfaces can inherit multiple interfaces
      $._terminator,
      repeat($._member_declaration),
      kw('End'), kw('Interface'), $._terminator
    ),

    // Enum definition block
    enum_block: $ => seq(
      field('modifiers', optional($.modifiers)),
      kw('Enum'),
      field('name', $.identifier),
      optional(seq(kw('As'), field('underlying_type', $.type))),
      $._terminator,
      repeat(choice($.enum_member, alias($._terminator, $.blank_line))),
      kw('End'), kw('Enum'), $._terminator
    ),
    enum_member: $ => seq(
      field('name', $.identifier),
      optional(seq('=', field('value', $.expression))),
      $._terminator
    ),

    // Delegate declaration (treated as a type declaration, no End block since it's a single line)
    delegate_declaration: $ => seq(
      field('modifiers', optional($.modifiers)),
      kw('Delegate'),
      choice(kw('Sub'), kw('Function')),
      field('name', $.identifier),
      optional($.type_parameters),
      field('parameters', $.parameter_list),
      optional(seq(kw('As'), field('return_type', $.type))),  // only for Function delegate
      $._terminator
    ),

    // Inheritance clause (for classes or interfaces)
    inherits_clause: $ => seq(kw('Inherits'), commaSep1($.type)),
    // Implements clause (for classes or structures implementing interfaces)
    implements_clause: $ => seq(kw('Implements'), commaSep1($.type)),

    // Generic type parameter definitions: e.g., (Of T As {Constraint})
    type_parameters: $ => seq(
      $._open_of,
      commaSep1($.type_parameter),
      ')'
    ),
    type_parameter: $ => seq(
      field('name', $.identifier),
      optional(seq(kw('As'), field('constraint', $.type_constraint)))
    ),
    type_constraint: $ => choice(
      $.type,
      kw('Structure'),
      kw('Class'),
      kw('New')  // type must have a public parameterless constructor
    ),

    // Attributes: <...> blocks attached to declarations
    attribute_block: $ => seq(
      '<',
      commaSep1($.attribute),
      '>'
    ),
    // attribute: $ => seq(
    //   optional(seq(field('target', $.identifier), ':')),  // e.g., Assembly: or Module: target
    //   field('name', $.identifier),
    //   optional($.argument_list)  // arguments in parentheses
    // ),
    attribute: $ => seq(
      optional(seq(field('target', $.identifier), ':')),
      field('name', choice($.identifier, $.namespace_name)),
      optional($.argument_list)
    ),

    // Modifiers (public/private/etc.). Multiple modifiers can appear in sequence.
    modifiers: $ => repeat1($.modifier),
    modifier: $ => token(choice(
      rawkw('Public'), rawkw('Private'), rawkw('Protected'), rawkw('Friend'),
      rawkw('Shared'), rawkw('Shadows'), rawkw('Static'),
      rawkw('Overloads'), rawkw('Overrides'), rawkw('Overridable'), rawkw('NotOverridable'), rawkw('MustOverride'),
      rawkw('MustInherit'), rawkw('NotInheritable'),
      rawkw('Partial'), rawkw('Narrowing'), rawkw('Widening'),
      rawkw('Default'),              // for default properties
      rawkw('ReadOnly'), rawkw('WriteOnly'),
      rawkw('WithEvents'), rawkw('Async'), rawkw('Iterator')
    )),

    // Type member declarations inside class/module/etc.
    _member_declaration: $ => choice(
      alias($._terminator, $.blank_line),
      seq($.inherits_clause, $._terminator),
      seq($.implements_clause, $._terminator),
      seq($.preprocessor_directive, $._terminator),
      $.const_declaration,
      $.field_declaration,
      $.dim_statement,
      $.method_declaration,
      $.constructor_declaration,
      $.operator_declaration,
      $.property_declaration,
      $.event_declaration,
      seq(repeat(seq(field('attributes', $.attribute_block), optional($._terminator))), $.type_declaration)  // nested Class/Module/Structure/Interface/Enum/Delegate
    ),

    // Constant definitions (inside classes or procedures)
    const_declaration: $ => seq(
      repeat(seq(field('attributes', $.attribute_block), optional($._terminator))),
      field('modifiers', optional($.modifiers)),
      kw('Const'),
      commaSep1(seq(
        field('name', $.identifier),
        optional($.as_clause),
        '=', 
        field('value', $.expression)
      )),
      $._terminator
    ),

    // Field (variable) declarations (inside classes/modules or as locals with Dim)
    // Member-level field. Modifiers are required: without that, `Dim x As T`
    // matches both this and dim_statement, and the parser resolves a method's
    // body away in favour of a bodyless method followed by fields.
    field_declaration: $ => seq(
      repeat(seq(field('attributes', $.attribute_block), optional($._terminator))),
      field('modifiers', $.modifiers),
      optional(kw('Dim')),
      commaSep1($.variable_declarator),
      $._terminator
    ),
    variable_declarator: $ => seq(
      field('name', $.identifier),
      repeat($.array_rank_specifier),
      optional($.as_clause),
      optional(seq('=', optional($._newline), field('initializer', $.expression)))
    ),
    array_rank_specifier: $ => seq(
      '(',
      optional(choice(
        commaSep1(seq($.expression, optional(seq(kw('To'), $.expression)))),
        repeat1(',')
      )),
      ')'
    ),
    as_clause: $ => seq(kw('As'), choice(field('type', $.type), $.new_expression)),

    // Type (for variables, parameters, return types, etc.)
    type: $ => seq(
      choice(
        $.primitive_type,
        $.array_type,
        $.generic_type,
        $.tuple_type,
        seq($.namespace_name, optional($.type_argument_list), optional($.array_rank_specifier))
      ),
      optional('?')   // nullable value type
    ),

    generic_type: $ => prec.left(3, seq(
      $.namespace_name,
      $.type_argument_list,
      repeat(seq('.', $.identifier, optional($.type_argument_list))),
      optional($.array_rank_specifier)
    )),

    // `(Kind As SyntaxKind, Text As String)`, `(Integer, String)`
    tuple_type: $ => seq(
      '(',
      commaSep1(seq(optional(seq(field('name', $.identifier), kw('As'))), $.type)),
      ')'
    ),

    // `Foo()` also matches `type`'s own namespace_name + array_rank_specifier; the dynamic
    // precedence makes it an array_type every time.
    array_type: $ => prec.dynamic(1, prec.right(seq(
      choice($.primitive_type, $.namespace_name),
      optional($.type_argument_list),
      repeat1($.array_rank_specifier)
    ))),

    primitive_type: $ => token(choice(  // built-in types
      rawkw('Boolean'), rawkw('Byte'), rawkw('Short'), rawkw('Integer'), rawkw('Long'),
      rawkw('Single'), rawkw('Double'), rawkw('Decimal'),
      rawkw('Char'), rawkw('String'),
      rawkw('Object'), rawkw('Date')
    )),
    type_argument_list: $ => seq($._open_of, commaSep1($.type), ')'),

    // "(Of" as a single token. Deciding whether "(" opens a type argument list
    // or an ordinary argument list needs two tokens of lookahead, which LR(1)
    // can't do - so the lexer settles it instead.
    _open_of: $ => alias(token(seq('(', /[ \t]*/, /[Oo][Ff]/, /[ \t\r\n]/)), '(Of'),

    // "Implements IFoo.Bar" / "Handles Button1.Click" on a member declaration
    member_implements_clause: $ => seq(kw('Implements'), commaSep1($.qualified_member)),
    handles_clause: $ => seq(kw('Handles'), commaSep1($.qualified_member)),
    qualified_member: $ => seq($.type, optional(seq('.', field('member', $.identifier)))),

    // Method (Sub/Function) declaration inside a class/module or as a procedure in a module
    method_declaration: $ => seq(
      repeat(seq(field('attributes', $.attribute_block), optional($._terminator))),
      field('modifiers', optional($.modifiers)),
      choice(kw('Sub'), kw('Function')),
      field('name', $.identifier),
      optional($.type_parameters),
      field('parameters', $.parameter_list),
      optional(seq(kw('As'), field('return_type', $.type))),  // only for Function
      optional($.member_implements_clause),
      optional($.handles_clause),
      choice(
        // With body. Dynamic precedence: `Dim x As T` is ambiguous between a
        // statement in the body and a field_declaration at member level, so
        // prefer the interpretation that finds a matching End Sub/End Function.
        prec.dynamic(10, seq($._terminator, repeat($.statement), kw('End'), choice(kw('Sub'), kw('Function')), $._terminator)),
        // Without body (interface member, MustOverride):
        $._terminator
      )
    ),

    // Constructor (Sub New) declaration
    constructor_declaration: $ => seq(
      repeat(seq(field('attributes', $.attribute_block), optional($._terminator))),
      field('modifiers', optional($.modifiers)),
      kw('Sub'), kw('New'),
      field('parameters', $.parameter_list),
      optional($.handles_clause),
      choice(
        prec.dynamic(10, seq($._terminator, repeat($.statement), kw('End'), kw('Sub'), $._terminator)),
        $._terminator
      )
    ),

    // Operator declaration: `Public Shared Operator +(a As T, b As T) As T`
    operator_declaration: $ => seq(
      repeat(seq(field('attributes', $.attribute_block), optional($._terminator))),
      field('modifiers', optional($.modifiers)),
      kw('Operator'),
      field('operator', choice('+', '-', '*', '/', '\\', '^', '&', '=', '<>', '<', '>', '<=', '>=', '<<', '>>',
        kw('Mod'), kw('And'), kw('Or'), kw('Xor'), kw('Not'), kw('Like'), kw('IsTrue'), kw('IsFalse'), kw('CType'))),
      field('parameters', $.parameter_list),
      optional(seq(kw('As'), field('return_type', $.type))),
      $._terminator,
      repeat($.statement),
      kw('End'), kw('Operator'), $._terminator
    ),

    // Property declaration (auto or with getters/setters)
    property_declaration: $ => seq(
      repeat(seq(field('attributes', $.attribute_block), optional($._terminator))),
      field('modifiers', optional($.modifiers)),
      kw('Property'),
      field('name', $.identifier),
      optional(field('parameters', $.parameter_list)),  // indexed properties
      optional($.as_clause),
      optional($.member_implements_clause),
      choice(
        // Auto-property or declaration without body:
        seq(optional(seq('=', field('initializer', $.expression))), $._terminator),
        // Property with Get/Set accessors:
        seq(
          $._terminator,
          repeat(choice($.get_accessor, $.set_accessor, alias($._terminator, $.blank_line))),
          kw('End'), kw('Property'), $._terminator
        )
      )
    ),
    get_accessor: $ => seq(
      optional(field('modifiers', optional($.modifiers))),
      kw('Get'), $._terminator,
      repeat($.statement),
      kw('End'), kw('Get'), $._terminator
    ),
    set_accessor: $ => seq(
      optional(field('modifiers', optional($.modifiers))),
      kw('Set'),
      optional(field('parameters', $.parameter_list)),  // Set can have a Value parameter
      $._terminator,
      repeat($.statement),
      kw('End'), kw('Set'), $._terminator
    ),

    // Event declaration (regular or custom event with add/remove/raise handlers)
    event_declaration: $ => seq(
      repeat(seq(field('attributes', $.attribute_block), optional($._terminator))),
      field('modifiers', optional($.modifiers)),
      kw('Event'),
      field('name', $.identifier),
      choice(
        // Standard event declaration
        seq(optional($.parameter_list), optional($.as_clause), optional($.member_implements_clause), $._terminator),
        // Custom event with handlers
        seq(
          $.parameter_list, $.as_clause, $._terminator,
          repeat(choice($.add_handler_block, $.remove_handler_block, $.raise_event_block, alias($._terminator, $.blank_line))),
          kw('End'), kw('Event'), $._terminator
        )
      )
    ),
    add_handler_block: $ => seq(
      optional(field('modifiers', optional($.modifiers))),
      kw('AddHandler'), $._terminator,
      repeat($.statement),
      kw('End'), kw('AddHandler'), $._terminator
    ),
    remove_handler_block: $ => seq(
      optional(field('modifiers', optional($.modifiers))),
      kw('RemoveHandler'), $._terminator,
      repeat($.statement),
      kw('End'), kw('RemoveHandler'), $._terminator
    ),
    raise_event_block: $ => seq(
      optional(field('modifiers', optional($.modifiers))),
      kw('RaiseEvent'), $._terminator,
      repeat($.statement),
      kw('End'), kw('RaiseEvent'), $._terminator
    ),

    // Parameter list for methods/delegates (Parentheses with comma-separated parameters)
    parameter_list: $ => seq('(', optional($._newline), optional(commaSep($.parameter)), optional($._newline), ')'),
    // parameter: $ => seq(
    //   optional(choice(kw('ByVal'), kw('ByRef'), kw('ParamArray'))),
    //   field('name', $.identifier),
    //   optional($.array_rank_specifier),
    //   optional($.as_clause),
    //   optional(seq('=', field('default_value', $.expression)))  // default parameter value
    // ),
    parameter: $ => seq(
      optional($.attribute_block),  // Add support for attributes on parameters
      optional(kw('Optional')),
      optional(choice(kw('ByVal'), kw('ByRef'), kw('ParamArray'))),
      field('name', $.identifier),
      optional($.array_rank_specifier),
      optional($.as_clause),
      optional(seq('=', field('default_value', $.expression)))
    ),

    // *** Statements (inside procedures or blocks) ***

    statement: $ => choice(
      $.empty_statement,
      $.label_statement,
      $.dim_statement,
      $.const_declaration,      // local constant
      prec(1, $.assignment_statement),
      $.call_statement,
      $.if_statement,
      $.select_case_statement,
      $.while_statement,
      $.do_statement,
      $.for_statement,
      $.for_each_statement,
      $.try_statement,
      $.with_statement,
      $.using_statement,
      $.sync_lock_statement,
      $.return_statement,
      $.yield_statement,
      $.exit_statement,
      $.continue_statement,
      $.throw_statement,
      $.goto_statement,
      $.redim_statement,
      $.raise_event_statement,
      $.add_handler_statement,
      $.remove_handler_statement,
      $.preprocessor_directive,  // allow preprocessor directives in code flow
      $.compound_assignment_statement,
    ),

    empty_statement: $ => prec(1, $._terminator),  // a standalone line break (no-op statement)

    label_statement: $ => seq(field('label', $.identifier), ':'),

    dim_statement: $ => seq(
      choice(kw('Dim'), seq(kw('Static'), optional(kw('Dim')))),
      commaSep1($.variable_declarator),
      $._terminator
    ),

    compound_assignment_statement: $ => seq(
      field('left', $.left_hand_side),
      field('operator', choice('+=', '-=', '*=', '/=', '\\=', '^=', '&=', '<<=', '>>=')),
      optional($._newline),
      field('right', $.expression),
      $._terminator
    ),

    assignment_statement: $ => seq(
      field('left', $.left_hand_side),
      '=',
      optional($._newline),
      field('right', $.expression),
      $._terminator
    ),
    left_hand_side: $ => choice(
      $.identifier,
      $.member_access,
      $.element_access,
      $.invocation,
      $.with_member_access
    ),

    call_statement: $ => seq(
      choice(seq(kw('Call'), $.expression), $.expression),
      $._terminator
    ),

    // if_statement: $ => choice(
    //   // Single-line If
    //   seq(
    //     kw('If'), field('condition', $.expression), kw('Then'),
    //     field('then_branch', $.statement),
    //     optional(seq(kw('Else'), field('else_branch', $.statement)))
    //   ),
    //   // Block If/ElseIf/Else
    //   seq(
    //     kw('If'), field('condition', $.expression), kw('Then'), $._terminator,
    //     repeat($.statement),
    //     repeat(seq(kw('ElseIf'), $.expression, kw('Then'), $._terminator, repeat($.statement))),
    //     optional(seq(kw('Else'), $._terminator, repeat($.statement))),
    //     kw('End'), kw('If'), $._terminator
    //   )
    // ),
    if_statement: $ => choice(
      // Single-line If
      prec(2, seq($._if_inline_core, $._terminator)),
      // Block If/ElseIf/Else
      prec(1, seq(
        kw('If'), field('condition', $.expression), kw('Then'), $._terminator,
        repeat($.statement),
        repeat($.elseif_clause),
        optional($.else_clause),
        kw('End'), kw('If'), $._terminator
      ))
    ),

    // Statements permitted on a single-line If, which - unlike $.statement -
    // must not consume the line terminator.
    _if_inline_core: $ => prec.right(seq(
      kw('If'), field('condition', $.expression), kw('Then'),
      field('then_branch', $._inline_statement),
      optional(seq(kw('Else'), field('else_branch', $._inline_statement)))
    )),

    _inline_statement: $ => choice(
      $._if_inline_core,
      seq(kw('Return'), optional($.expression)),
      seq(kw('Yield'), $.expression),
      seq(kw('RaiseEvent'), field('name', $.identifier), optional($.argument_list)),
      seq(kw('Throw'), optional($.expression)),
      seq(kw('Exit'), choice(kw('Sub'), kw('Function'), kw('Property'), kw('Do'), kw('For'), kw('While'), kw('Select'), kw('Try'))),
      seq(kw('Continue'), choice(kw('Do'), kw('For'), kw('While'))),
      seq(kw('GoTo'), field('label', $.identifier)),
      prec(2, seq(field('left', $.left_hand_side), '=', field('right', $.expression))),
      prec(2, seq(field('left', $.left_hand_side), field('operator', choice('+=', '-=', '*=', '/=', '\\=', '^=', '&=', '<<=', '>>=')), field('right', $.expression))),
      prec(1, seq(optional(kw('Call')), $.expression))
    ),

    elseif_clause: $ => seq(
      kw('ElseIf'), field('condition', $.expression), kw('Then'), $._terminator,
      repeat($.statement)
    ),

    else_clause: $ => seq(
      kw('Else'), $._terminator,
      repeat($.statement)
    ),

    select_case_statement: $ => seq(
      kw('Select'), optional(kw('Case')), field('selector', $.expression), $._terminator,
      repeat(alias($._terminator, $.blank_line)),
      repeat($.case_block),
      optional($.case_else_block),
      kw('End'), kw('Select'), $._terminator
    ),
    case_block: $ => seq(
      kw('Case'),
      commaSep1($.case_clause),
      $._terminator,
      repeat($.statement)
    ),
    case_else_block: $ => seq(
      kw('Case'), kw('Else'), $._terminator,
      repeat($.statement)
    ),
    case_clause: $ => choice(
      $.expression,
      seq($.expression, kw('To'), $.expression),                // range: low To high
      seq(kw('Is'), $.relational_operator, $.expression)        // relational form: e.g. Is < 5
    ),
    relational_operator: $ => token(choice('=', '<>', '<', '>', '<=', '>=')),

    while_statement: $ => seq(
      kw('While'), field('condition', $.expression), $._terminator,
      repeat($.statement),
      kw('End'), kw('While'), $._terminator
    ),

    do_statement: $ => choice(
      // Do ... Loop [While/Until condition] (exit condition at bottom)
      seq(kw('Do'), $._terminator,
          repeat($.statement),
          kw('Loop'), optional(choice(seq(kw('While'), $.expression), seq(kw('Until'), $.expression))), $._terminator),
      // Do [While/Until condition] ... Loop (check at top)
      seq(kw('Do'), choice(seq(kw('While'), $.expression), seq(kw('Until'), $.expression)), $._terminator,
          repeat($.statement),
          kw('Loop'), $._terminator)
    ),

    // for_statement: $ => seq(
    //   kw('For'),
    //   field('variable', $.identifier), '=', field('start', $.expression),
    //   kw('To'), field('end', $.expression),
    //   optional(seq(kw('Step'), field('step', $.expression))),
    //   $._terminator,
    //   repeat($.statement),
    //   kw('Next'), optional(alias($.identifier, $.variable)), $._terminator
    // ),
    for_statement: $ => seq(
      kw('For'),
      choice(
        // With type declaration
        seq(
          field('variable', $.identifier),
          $.as_clause,
          '=',
          field('start', $.expression)
        ),
        // Without type declaration
        seq(
          field('variable', $.identifier),
          '=',
          field('start', $.expression)
        )
      ),
      kw('To'), field('end', $.expression),
      optional(seq(kw('Step'), field('step', $.expression))),
      $._terminator,
      repeat($.statement),
      // kw('Next'), optional(field('variable', $.identifier)), $._terminator
      kw('Next'), optional(field('variable', $.identifier)), $._terminator
    ),

    // for_each_statement: $ => seq(
    //   kw('For'), kw('Each'),
    //   field('variable', $.identifier),
    //   kw('In'),
    //   field('collection', $.expression),
    //   $._terminator,
    //   repeat($.statement),
    //   kw('Next'), optional(alias($.identifier, $.variable)), $._terminator
    // ),
    for_each_statement: $ => seq(
      kw('For'), kw('Each'),
      field('variable', $.identifier),
      optional($.as_clause),
      kw('In'),
      field('collection', $.expression),
      $._terminator,
      repeat($.statement),
      kw('Next'), optional(field('variable', $.identifier)), $._terminator
    ),

    try_statement: $ => seq(
      kw('Try'), $._terminator,
      repeat($.statement),
      repeat($.catch_block),
      optional($.finally_block),
      kw('End'), kw('Try'), $._terminator
    ),
    catch_block: $ => seq(
      kw('Catch'),
      optional(seq(field('exception', $.identifier), optional(seq(kw('As'), field('type', $.type))))),
      optional(seq(kw('When'), field('filter', $.expression))),
      $._terminator,
      repeat($.statement)
    ),
    finally_block: $ => seq(
      kw('Finally'), $._terminator,
      repeat($.statement)
    ),

    with_statement: $ => seq(
      kw('With'), field('target', $.expression), $._terminator,
      repeat($.statement),
      kw('End'), kw('With'), $._terminator
    ),

    using_statement: $ => seq(
      kw('Using'),
      choice(
        // Using resourceVar As Type = expr
        seq(field('resource', $.identifier), $.as_clause, optional(seq('=', field('value', $.expression)))),
        // Using <expression>
        field('value', $.expression)
      ),
      $._terminator,
      repeat($.statement),
      kw('End'), kw('Using'), $._terminator
    ),

    sync_lock_statement: $ => seq(
      kw('SyncLock'), field('lock', $.expression), $._terminator,
      repeat($.statement),
      kw('End'), kw('SyncLock'), $._terminator
    ),

    return_statement: $ => seq(kw('Return'), optional($.expression), $._terminator),

    yield_statement: $ => seq(kw('Yield'), $.expression, $._terminator),

    exit_statement: $ => seq(kw('Exit'), choice(kw('Sub'), kw('Function'), kw('Property'), kw('Do'), kw('For'), kw('While'), kw('Select'), kw('Try')), $._terminator),

    continue_statement: $ => seq(kw('Continue'), choice(kw('Do'), kw('For'), kw('While')), $._terminator),

    throw_statement: $ => seq(kw('Throw'), optional($.expression), $._terminator),

    goto_statement: $ => seq(kw('GoTo'), field('label', $.identifier), $._terminator),

    redim_statement: $ => seq(
      kw('ReDim'),
      optional(kw('Preserve')),
      commaSep1(choice(
        prec.dynamic(1, seq(field('array', $.identifier), $.re_dim_clause)),
        field('array', $.expression)  // `Me.items(n)`, `a.b(n)`: the bounds are the call's arguments
      )),
      $._terminator
    ),
    re_dim_clause: $ => seq(
      '(',
      commaSep1(seq(field('upper_bound', $.expression), optional(seq(kw('To'), $.expression)))),
      ')'
    ),

    add_handler_statement: $ => seq(
      kw('AddHandler'), field('event', $.expression), COMMA, field('handler', $.expression), $._terminator
    ),
    remove_handler_statement: $ => seq(
      kw('RemoveHandler'), field('event', $.expression), COMMA, field('handler', $.expression), $._terminator
    ),

    raise_event_statement: $ => seq(
      kw('RaiseEvent'),
      field('name', $.identifier),
      optional($.argument_list),
      $._terminator
    ),

    // Preprocessor directive (treated as a standalone statement)
    preprocessor_directive: $ => token(seq('#', /[^\r\n]*/)),

    // *** Expressions ***

    expression: $ => choice(
      $.literal,
      $.identifier,
      $.parenthesized_expression,
      $.member_access,
      $.with_member_access,
      $.element_access,
      $.invocation,
      $.generic_name,
      $.tuple_expression,
      $.unary_expression,
      $.binary_expression,
      $.ternary_expression,
      $.new_expression,
      $.lambda_expression,
      $.array_literal,
    ),

    array_literal: $ => seq(
      $._open_brace,
      optional(commaSep($.expression)),
      optional($._newline),
      '}'
    ),

    parenthesized_expression: $ => seq('(', optional($._newline), $.expression, optional($._newline), ')'),

    lambda_expression: $ => prec.right(seq(
      optional(choice(kw('Async'), kw('Iterator'))),
      choice(kw('Function'), kw('Sub')),
      '(',
      optional(commaSep($.lambda_parameter)),
      ')',
      choice(
        $.expression,  // Single expression lambda
        seq(           // Multi-line lambda
          optional(seq(kw('As'), field('return_type', $.type))),
          $._terminator,
          repeat($.statement),
          kw('End'), choice(kw('Function'), kw('Sub'))
        )
      )
    )),

    lambda_parameter: $ => seq(
      field('name', $.identifier),
      optional($.as_clause)
    ),
    
    invocation: $ => prec.left(1, seq(
      field('target', choice($.member_access, $.identifier)),
      optional($.type_argument_list),
      field('arguments', $.argument_list)
    )),

    // `Create(Of T)`, `ImmutableArray(Of T).Empty`. Below invocation, so `Create(Of T)(x)`
    // stays a call.
    generic_name: $ => prec.left(0, seq(
      field('target', choice($.member_access, $.identifier)),
      $.type_argument_list
    )),

    // A tuple of two or more elements, each optionally named: `(1, "a")`, `(kind:=k, text:=t)`.
    tuple_expression: $ => seq(
      '(',
      $.argument,
      repeat1(seq(COMMA, $.argument)),
      ')'
    ),

    argument_list: $ => seq(
      '(',
      optional($._newline),
      optional(seq(
        optional($.argument),
        repeat(seq(COMMA, optional($.argument)))
      )),
      optional($._newline),
      ')'
    ),
    argument: $ => choice(
      $.expression,
      seq(field('name', $.identifier), ':', '=', optional($._newline), $.expression)  // named argument (Name:=Expr)
    ),

    // Member access (object.member) possibly spanning lines after the dot
    // member_access: $ => seq(
    //   field('object', $.expression),
    //   token(seq('.', optional(/\r?\n/))),  // allow newline after dot (implicit line continuation)
    //   field('member', $.identifier)
    // ),
    member_access: $ => prec.left(10, seq(
      field('object', $.expression),
      choice('.', '?.'),
      optional($._newline),
      field('member', $.identifier)
    )),

    // Leading-dot member access inside a With block: ".Timeout = 10"
    with_member_access: $ => prec.left(11, seq('.', field('member', $.identifier))),

    // Element/array index access: expr(index, index, ...)
    element_access: $ => seq(
      field('object', $.expression),
      '(',
      optional($._newline),
      commaSep(field('index', $.expression)),
      optional($._newline),
      ')'
    ),

    // Object creation: New Type[(args)] [ with initializers ]
    // new_expression: $ => seq(
    //   kw('New'),
    //   field('type', $.type),
    //   optional($.argument_list),
    //   optional($.object_initializers)
    // ),
    // `New T(args)` calls a constructor, with or without `With {...}` or `From {...}`;
    // `New T(bounds) {...}` creates an array. Both readings parse until the `{`, so the
    // dynamic precedence decides: the argument list wins unless a `{...}` follows it.
    new_expression: $ => choice(
      prec.dynamic(2, seq(
        kw('New'),
        field('type', $.type),
        $.argument_list,
        optional(choice($.with_initializer, $.from_initializer))
      )),
      prec.dynamic(-1, seq(
        kw('New'),
        field('type', $.type),
        $.argument_list,
        $.object_initializers
      )),
      seq(
        kw('New'),
        field('type', $.type),
        optional(choice(
          $.object_initializers,
          $.with_initializer,
          $.from_initializer
        ))
      )
    ),

    from_initializer: $ => seq(kw('From'), optional($._newline), $.object_initializers),

    with_initializer: $ => seq(
      kw('With'),
      $._open_brace,
      optional(commaSep($.member_initializer)),
      optional($._newline),
      '}'
    ),

    member_initializer: $ => seq(
      '.',
      field('member', $.identifier),
      '=',
      field('value', $.expression)
    ),
    object_initializers: $ => seq(
      $._open_brace,
      optional(commaSep($.object_initializer)),
      optional($._newline),
      '}'
    ),

    // "{" optionally followed by a newline, for initialisers spread over lines.
    // Aliased so queries can still match it as "{".
    _open_brace: $ => alias(token(seq('{', /[ \t]*/, optional(/\r?\n/))), '{'),
    object_initializer: $ => choice(
      seq('.', $.identifier, '=', $.expression),  // assignment to member
      $.expression                               // value for collection initializer
    ),

    // Unary operators: e.g. -x, +x, Not x, AddressOf x
    unary_expression: $ => prec(8, seq(
      field('operator', choice(kw('Not'), kw('AddressOf'), kw('Await'), kw('TypeOf'), '-', '+')),
      field('operand', $.expression)
    )),

    // Binary operators with precedence (higher number = higher precedence binding)
    binary_expression: $ => {
      const table = [
        [7, choice('^')],                              // exponentiation (right-associative in VB)
        [6, choice('*', '/', '\\', kw('Mod'))],        // multiplication, division, integer division, modulo
        [5, choice('+', '-')],                         // addition and subtraction
        [4, kw('&')],                                  // string concatenation
        [3, choice('<<', '>>')],                       // bit shifts
        [2, choice('=', '<>', '<', '>', '<=', '>=', kw('Is'), kw('IsNot'), kw('Like'))],  
        [0, choice(kw('And'), kw('Or'), kw('Xor'))],   // boolean/bitwise AND/OR/XOR
        [-1, choice(kw('AndAlso'), kw('OrElse'))]      // short-circuit logical operators (lowest precedence)
      ];
      // Build binary expression rules for each operator with correct precedence and associativity
      return choice(...table.map(([precedence, operator]) =>
        prec.left(precedence, seq(field('left', $.expression), field('operator', operator), optional($._newline), field('right', $.expression)))
      ));
    },

    // Ternary conditional (IIf-like or If operator: If(condition, trueExpr, falseExpr))
    ternary_expression: $ => prec.right(1, seq(
      kw('If'),
      '(',
      optional($._newline),
      field('condition', $.expression), COMMA,
      field('true_branch', $.expression),
      optional(seq(COMMA, field('false_branch', $.expression))),
      optional($._newline),
      ')'
    )),

    // Literals
    literal: $ => choice(
      $.boolean_literal,
      $.integer_literal,
      $.floating_point_literal,
      $.string_literal,
      $.character_literal,
      $.date_literal,
      $.xml_cdata_literal,
      kw('Nothing')
    ),

    boolean_literal: $ => token(choice(rawkw('True'), rawkw('False'))),

    integer_literal: $ => token(choice(
      // Decimal literal (optional type suffix)
      /\d+(?:US|UI|UL|S|I|L|%|&)?/i,
      // Hexadecimal literal (prefix &H)
      /&H[0-9A-F]+(?:US|UI|UL|S|I|L|%|&)?/i,
      // Octal literal (prefix &O)
      /&O[0-7]+(?:US|UI|UL|S|I|L|%|&)?/i
    )),  

    floating_point_literal: $ => token(choice(
      // Formats: D (integer) . D (fraction) E? exponent, etc., with optional FP type suffix (F, R, D, !, #, @)
      /\d+\.\d+([Ee][+-]?\d+)?[FfRrDd!#@]?/,
      /\d+\.([Ee][+-]?\d+)?[FfRrDd!#@]?/,
      /\.\d+([Ee][+-]?\d+)?[FfRrDd!#@]?/,
      /\d+([Ee][+-]?\d+)[FfRrDd!#@]?/,
      /\d+[FfRrDd!#@]/
    )),

    // string_literal: $ => token(seq(
    //   '"',
    //   repeat(choice(/[^"\r\n]/, /""/)),  // double "" inside represents a quote
    //   '"'
    // )),
    string_literal: $ => choice(
      // Regular string
      token(seq(
        '"',
        repeat(choice(/[^"]/, /""/)),
        '"'
      )),
      // Interpolated string
      $.interpolated_string_literal
    ),

    interpolated_string_literal: $ => seq(
      '$"',
      repeat(choice(
        token(prec(1, /[^"{}]+/)),  // Regular text, line breaks included; never a comment
        token(prec(1, '""')),        // Escaped quote
        token(prec(1, '{{')),        // Escaped braces
        token(prec(1, '}}')),
        $.interpolation // Interpolated expression
      )),
      '"'
    ),

    interpolation: $ => seq(
      '{',
      $.expression,
      optional(seq(',', $.expression)), // Alignment
      optional(seq(':', token.immediate(prec(1, /[^}]+/)))), // Format specifier
      '}'
    ),

    character_literal: $ => token(seq(
      '"',
      choice(/[^"\r\n]/, /""/),  // exactly one character (or an escaped quote)
      '"',
      /[cC]/                    // 'C' suffix (case-insensitive)
    )),

    xml_cdata_literal: $ => token(seq(
      '<', /[A-Za-z_][\w.:-]*/, '>',
      '<![CDATA[', repeat(choice(/[^\]]/, /\][^\]]/, /\]\][^>]/)), ']]>',
      '</', /[A-Za-z_][\w.:-]*/, '>'
    )),

    // Date literal: #MM/dd/yyyy [hh:mm[:ss] [AM|PM]]#
    date_literal: $ => token(seq(
      '#',
      /[0-9/\-:\sAPMapm]+/,  // simplified pattern: digits, '/', '-', ':', whitespace, AM/PM
      '#'
    )),

    // Identifiers (case-insensitive, including escaped [bracketed] identifiers and type-char suffix)
    // Split so the plain form can serve as the `word` token. Keyword extraction
    // only engages for a simple terminal, not a choice() of two patterns.
    identifier: $ => choice($._word_identifier, $._escaped_identifier),
    _word_identifier: $ => /[A-Za-z_][A-Za-z_0-9]*[$%&@#!]?/,
    _escaped_identifier: $ => /\[(?:[^\]\r\n]+)\]/,

    // Comment: `'` or `REM` to end of line
    comment: $ => token(choice(
      seq("'", /[^\r\n]*/),
      seq(rawkw('REM'), /[ \t]/, /[^\r\n]*/)
    )),

    // Line break (statement terminator)
    _newline: $ => /\r?\n/,

    _line_continuation: $ => token(seq('_', /[ \t]*/, /\r?\n/)),

    // Statement terminator: newline or colon (for multiple statements on one line)
    _terminator: $ => choice($._newline, ':')
  }
});

// Helper: comma-separated list (zero or more)
function commaSep(rule) {
  return optional(commaSep1(rule));
}

// Hidden keyword token. Used only inside token(), where alias() is illegal.
function rawkw(word) {
  return token(ci(word));
}

// Keyword token aliased to a stable name, so tree-sitter queries can capture it.
function kw(word) {
  return alias(token(ci(word)), word);
}

// Helper: comma-separated list (one or more), allowing a newline after commas
function commaSep1(rule) {
  return seq(rule, repeat(seq(COMMA, rule)));
}

// Case-insensitive literal helper: creates a regex that matches the given keyword in any case
function ci(keyword) {
  const pattern = keyword.split('').map(ch => {
    if (/[A-Za-z]/.test(ch)) {
      return `[${ch.toLowerCase()}${ch.toUpperCase()}]`;
    }
    // Escape any regex special characters (though keywords are alphabetic in VB)
    return ch.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  }).join('');
  return new RegExp(pattern);
}

