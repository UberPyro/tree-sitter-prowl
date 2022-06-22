const id_tail = "(\-?[A-Za-z0-9_\'])*";
const sym = "[~!@#$%^&*\\-=+\\.?:<>|/\\\\]+";
const suffix = "([?+*!]|!!)?";
const comment = /([^*\/]|\*[^\/]|\/[^*]|[ \t\n])*[^*\/]/;

module.exports = grammar({
  name: 'prowl',

  extras: $ => [
    /\s/, 
    $.comment, 
  ], 

  word: $ => $.id, 

  inline: $ => [
    $.let_body, 
    $.parameter, 
  ],

  rules: {
    source_file: $ => repeat($.def),
    comb: $ => /zap|i|unit|run|dup|nip|sap|dip|cat|swat|swap|cons|tack|sip|peek|cake|poke|dig|bury|flip|duco|rot/,
    prim: $ => /int|float|str|char|opt/,

    letkw: $ => choice("let", $.letop), 
    andkw: $ => choice("and", $.andop), 
    askw:  $ => choice("as",  $.asop), 
    letop: $ => new RegExp("let" + sym), 
    andop: $ => new RegExp("and" + sym), 
    asop:  $ => new RegExp("as"  + sym), 

    id: $ => new RegExp("[a-z]" + id_tail), 
    id_reg: $ => new RegExp("[a-z]" + id_tail + suffix), 
    reg_paren: $ => new RegExp("\\)" + suffix), 
    cap: $ => new RegExp("[A-Z]" + id_tail), 
    symbol: $ => new RegExp(sym), 
    stackvar: $ => choice(new RegExp("[a-z]\\*" + id_tail), "/"), 
    blank: $ => new RegExp("_" + id_tail), 
    int: $ => /0|[1-9][0-9]*/, 
    float: $ => /[1-9]\.[0-9]*|\.[0-9]+/, 
    string: $ => seq('"', repeat($.string_content), '"'),
    char: $ => seq("'", optional($.character_content), "'"),

    string_content: $ => choice(
      token.immediate(' '),
      token.immediate('\n'),
      token.immediate('\t'),
      /[^\\"]+/,
      $.escape_sequence
    ),

    character_content: $ => choice(
      /[^\\']/,
      $.escape_sequence
    ),

    escape_sequence: $ => choice(
      /\\[\\"'ntbr ]/,
      /\\[0-9][0-9][0-9]/,
      /\\x[0-9A-Fa-f][0-9A-Fa-f]/,
      /\\o[0-3][0-7][0-7]/
    ),

    comment: $ => seq(
      "/*", choice(
        comment, 
        comment, $.comment, comment
      ), "*/"
    ),

    access: $ => choice("hidden", "sealed"), 
    parameter: $ => choice(
      seq("[", $.stackvar, repeat($.cap), "--", 
               $.stackvar, repeat($.cap), "]"
      ), 
      $.cap
    ), 

    sig: $ => choice(
      $.cap, 
      seq("sig", repeat($.spec), "end")
    ),

    spec: $ => choice(
      seq("type", repeat($.parameter), $.id, optional(seq("=", $.ty_val))), 
      seq("spec", $.name, ":", $.ty), 
      seq("data", repeat($.parameter), $.id, "=", $.data), 
      seq("open", $.ty_val), 
      seq("mix", $.ty_val), 
      seq("exn", repeat(choice($.ty_val, $.record)), $.cap), 
      seq("mod", repeat($.spec), "end"),
      seq("sig", repeat($.spec), "end"),
    ), 

    ty: $ => seq(
      optional($.stackvar), repeat($.ty_val), "--", 
      optional($.stackvar), repeat($.ty_val)
    ), 

    ty_val: $ => choice(
      $.prim, 
      $.cap, 
      $.id, 
      seq("[", $.ty, "]"), 
      seq("(", $.ty, ")"),
      seq("#[", $.ty, "]"), 
      seq("%[", $.cap, "=>", $.ty, "]"), 
      seq("(", "mod", $.sig, ")"),
      seq("<", $.id, ":", $.ty_val, ">"), 
      seq("{", "}"), 
      seq("{", ";", "}"), 
      prec.left(seq($.ty_val, ".", $.ty_val)),
      seq("(", "type", $.cap, ")"),
    ), 

    data: $ => choice(
      sep1(";", seq(repeat(choice($.ty_val, $.record)), $.cap)), 
      $.record
    ),

    record: $ => seq(
      "{", 
      sep1(",", seq($.id, optional(seq(":", $.ty)))), 
      "}"
    ),

    spec_op: $ => new RegExp("(let|and|as)?" + sym),
    name: $ => choice(
      $.id, 
      seq("(", $.symbol2, ")"), 
      seq("{", $.spec_op, "}"), 
    ),

    mod: $ => repeat1($.mod_val),

    mod_val: $ => choice(
      $.cap,
      seq("impl", repeat($.def), "end"),
      seq("(", "def", $.id, ":", $.sig, ")"),
      seq("(", $.mod, ")"),
    ),

    def: $ => choice(
      seq(optional($.access), "type", repeat($.parameter), $.id, optional(seq("=", $.ty_val))), 
      seq(optional($.access), "data", repeat($.parameter), $.id, "=", $.data), 
      seq(optional($.access), "def", repeat($.p_val), $.name, optional(seq(":", $.ty)), "=", $.e), 
      seq(optional("tacit"), "open", $.e), 
      seq("mix", $.e), 
      seq("exn", repeat(choice($.ty_val, $.record)), $.cap), 
      seq(optional($.access), "mod", "type", $.cap, "=", $.sig),
      seq(optional($.access), optional("tacit"), "mod", $.cap, optional(seq(choice(":", ":>"), $.ty)), "=", $.mod)
    ), 

    e: $ => choice(
      $.symbol2, 
      seq($.e_term, $.symbol2), 
      seq($.symbol2, $.e_term), 
      $.e_term, 
      $.bind, 
      seq($.e_term, $.bind), 
      seq($.e_term, $.symbol2, $.bind), 
    ), 

    bind: $ => choice(
      seq($.letkw, $.let_body, repeat(seq($.andkw, $.let_body)), "->", $.e), 
      seq($.askw, repeat($.p_val), optional(seq(":", $.ty)), "->", $.e), 
    ), 

    let_body: $ => seq(repeat($.p_val), $.name, optional(seq(":", $.ty)), "=", $.e), 

    symbol2: $ => choice(
      "**", "/", "*", "-", "+", "..", ":<", "<>", ">:", "<=", "<", ">=", ">", 
      "/=", "==", $.symbol, ">=>", ">~>", ">>=", ">>~", "&&", "<<", ">>", "|", 
      "~", "$", 
    ), 

    e_term: $ => choice(
      prec.right(16, seq($.e_term, "**", $.e_term)), 
      prec.left( 15, seq($.e_term, "/", $.e_term)), 
      prec.left( 15, seq($.e_term, "*", $.e_term)), 
      prec.left( 14, seq($.e_term, "-", $.e_term)), 
      prec.left( 13, seq($.e_term, "+", $.e_term)), 
      prec.left( 12, seq($.e_term, "..", $.e_term)), 
      prec.right(11, seq($.e_term, ":<", $.e_term)), 
      prec.left( 10, seq($.e_term, "<>", $.e_term)), 
      prec.left(  9, seq($.e_term, ">:", $.e_term)), 
      prec.left(  8, seq($.e_term, "<=", $.e_term)), 
      prec.left(  8, seq($.e_term, "<", $.e_term)), 
      prec.left(  8, seq($.e_term, ">=", $.e_term)), 
      prec.left(  8, seq($.e_term, ">", $.e_term)), 
      prec.left(  7, seq($.e_term, "/=", $.e_term)), 
      prec.left(  7, seq($.e_term, "==", $.e_term)), 
      prec.left(  6, seq($.e_term, $.symbol, $.e_term)), 
      prec.left(  5, seq($.e_term, ">=>", $.e_term)), 
      prec.left(  5, seq($.e_term, ">~>", $.e_term)), 
      prec.left(  4, seq($.e_term, ">>=", $.e_term)), 
      prec.left(  4, seq($.e_term, ">>~", $.e_term)), 
      prec.left(  3, seq($.e_term, "&&", $.e_term)), 
      prec.right( 3, seq($.e_term, "<<", $.e_term)), 
      prec.left(  3, seq($.e_term, ">>", $.e_term)), 
      prec.left(  2, seq($.e_term, "|", $.e_term)), 
      prec.left(  1, seq($.e_term, "~", $.e_term)), 
      prec.left(  1, seq($.e_term, "$", $.e_term)), 

      repeat1($.e_val), 
    ), 

    e_val: $ => choice(
      "throw", 
      $.comb,

      $.int, 
      $.float, 
      $.string, 
      $.char, 

      seq("#[", sep(",", $.e), "]"), 
      seq("%[", sep(",", seq($.e, "=>", $.e)), "]"), 
      seq("[", $.e, "]"), 
      seq("[", "]"), 
      seq("[", ";", "]"), 
      $.id_reg, 

      $.cap, 
      seq("{", optional(seq("mix", $.e, ",")), sep1(",", seq($.id, optional(seq("=", $.e)))), "}"), 
      seq("(", "mod", $.mod, optional(seq(":", $.sig)), ")"), 

      seq("(", sep1(";", sep1(",", $.e)), $.reg_paren), 
      seq("(", $.reg_paren), 
      seq("(", ";", ")"),

      prec.right(1, seq("&", $.e_val)),
      prec.right(1, seq("!", $.e_val)),

      prec.left(2, seq($.e_val, ".", $.e_val)), 
      prec.left(2, seq($.e_val, ":", $.e_val)), 

      seq("{", choice($.symbol2, $.letop, $.andop, $.asop), "}"), 
      seq("{", $.e_term, $.symbol2, "}"), 
      seq("{", $.symbol2, $.e_term, "}"), 
      seq("{", "}"), 
    ), 

    p: $ => choice(
      prec.left(4, seq($.p, ">:", $.p)), 
      prec.left(3, seq($.p, ":<", $.p)), 
      prec.left(2, seq($.p, "*", $.p)), 
      prec.left(1, seq($.p, "+", $.p)), 

      repeat1($.p_val), 
    ), 

    p_val: $ => choice(
      $.int, 
      $.float, 
      $.string, 
      $.char, 
      "catch", 
      
      seq("#[", sep(",", $.p), "]"), 
      seq("%[", sep(",", seq($.e, "=>", $.p)), "]"), 
      seq("[", $.p, "]"), 
      seq("[", "]"), 
      seq("[", ";", "]"), 

      $.cap, 
      seq("{", sep1(", ", seq($.id, optional(seq("=", $.p)))), optional(seq(", ", "..")), "}"), 
      seq("<", $.p_val, ":", $.ty_val, ">"), 
      seq("(", "mod", $.model, optional(seq(":", $.sig)), ")"),

      $.id, 
      $.blank, 
      seq("(", $.p, ")"), 
      seq("(", $.p_val, ":", $.ty_val, ")"), 
      seq("(", ")"), 
      seq("(", ";", ")"), 
      seq("{", "}"), 

      prec.left(1, seq($.id, ".", $.p_val)), 
    ), 

    model: $ => choice(
      $.cap, 
      seq(optional("tacit"), "open"),
    ),
  }
});

function sep(delimiter, rule) {
  return optional(sep1(delimiter, rule))
}

function sep1(delimiter, rule) {
  return seq(
    optional(delimiter), 
    rule, 
    repeat(seq(delimiter, rule)), 
    optional(delimiter)
  )
}
