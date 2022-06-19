const id_tail = "(\-?[A-Za-z0-9_\'])*";
const sym = "[~!@#$%^&*\\-=+\\.?:<>|/\\\\]+";
const suffix = "([?+*!]|!!)?";

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
    source_file: $ => repeat($.s),
    comb: $ => /zap|i|unit|run|dup|nip|sap|dip|cat|swat|swap|cons|tack|sip|peek|cake|poke|dig|bury|flip|duco|rot/,
    prim: $ => /int|float|str|opt/,

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
    stackvar: $ => new RegExp("[a-z]\\*" + id_tail), 
    blank: $ => new RegExp("_" + id_tail), 
    int: $ => /0|[1-9][0-9]*/, 
    float: $ => /[1-9]\.[0-9]*|\.[0-9]+/, 
    string: $ => /"([^"]|\\")*"/,

    comment: $ => /\*[\s\S]*?\*/, 

    access: $ => choice("priv", "opaq"), 
    parameter: $ => seq(
      "[", $.stackvar, repeat($.cap), "--", 
           $.stackvar, repeat($.cap), "]"
    ), 

    sp: $ => choice(
      seq("type", repeat($.parameter), $.id, optional(seq("=", $.ty_val))), 
      seq("spec", $.name, ":", $.ty), 
      seq("data", repeat($.parameter), $.id, "=", $.data), 
      seq("open", $.ty_val), 
      seq("mix", $.ty_val), 
      seq("exn", repeat(choice($.ty_val, $.record)), $.cap), 
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
      seq("#[", $.ty, "]"), 
      seq("%[", $.cap, "=>", $.ty, "]"), 
      seq("sig", repeat($.sp), "end"), 
      seq("mod", repeat($.sp), "end"), 
      seq("<", $.id, ":", $.ty_val, ">"), 
      seq("{", "}"), 
      seq("{", ";", "}"), 
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

    s: $ => choice(
      seq(optional($.access), "type", repeat($.parameter), $.id, optional(seq("=", $.ty_val))), 
      seq(optional($.access), "data", repeat($.parameter), $.id, "=", $.data), 
      seq(optional($.access), optional("impl"), "def", repeat($.p_val), $.name, optional(seq(":", $.ty)), "=", $.e), 
      seq(optional("impl"), "open", $.e), 
      seq("mix", $.e), 
      seq("exn", repeat(choice($.ty_val, $.record)), $.cap), 
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
      "**", "/", "*", "-", "+", "..", ":<", "<>", "::", "<=", "<", ">=", ">", 
      "/=", "==", $.symbol, ">=>", ">>=", "&&", "<<", ">>", "|", "~", 
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
      prec.left(  9, seq($.e_term, "::", $.e_term)), 
      prec.left(  8, seq($.e_term, "<=", $.e_term)), 
      prec.left(  8, seq($.e_term, "<", $.e_term)), 
      prec.left(  8, seq($.e_term, ">=", $.e_term)), 
      prec.left(  8, seq($.e_term, ">", $.e_term)), 
      prec.left(  7, seq($.e_term, "/=", $.e_term)), 
      prec.left(  7, seq($.e_term, "==", $.e_term)), 
      prec.left(  6, seq($.e_term, $.symbol, $.e_term)), 
      prec.left(  5, seq($.e_term, ">=>", $.e_term)), 
      prec.left(  4, seq($.e_term, ">>=", $.e_term)), 
      prec.left(  3, seq($.e_term, "&&", $.e_term)), 
      prec.right( 3, seq($.e_term, "<<", $.e_term)), 
      prec.left(  3, seq($.e_term, ">>", $.e_term)), 
      prec.left(  2, seq($.e_term, "|", $.e_term)), 
      prec.left(  1, seq($.e_term, "~", $.e_term)), 

      repeat1($.e_val), 
    ), 

    e_val: $ => choice(
      "throw", 
      $.comb,

      $.int, 
      $.float, 
      $.string, 

      seq("#[", sep(",", $.e), "]"), 
      seq("%[", sep(",", seq($.e, "=>", $.e)), "]"), 
      seq("[", $.e, "]"), 
      seq("[", "]"), 
      seq("[", ";", "]"), 
      $.id_reg, 

      $.cap, 
      seq("{", optional(seq("mix", $.e, ",")), sep1(",", seq($.id, optional(seq("=", $.e)))), "}"), 
      seq("mod", repeat($.s), "end"), 

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
      prec.left(4, seq($.p, "::", $.p)), 
      prec.left(3, seq($.p, ":<", $.p)), 
      prec.left(2, seq($.p, "*", $.p)), 
      prec.left(1, seq($.p, "+", $.p)), 

      repeat1($.p_val), 
    ), 

    p_val: $ => choice(
      $.int, 
      $.float, 
      $.string, 
      seq(optional("impl"), "open"), 
      "catch", 
      
      seq("#[", sep(",", $.p), "]"), 
      seq("%[", sep(",", seq($.e, "=>", $.p)), "]"), 
      seq("[", $.p, "]"), 
      seq("[", "]"), 
      seq("[", ";", "]"), 

      $.cap, 
      seq("{", sep1(", ", seq($.id, optional(seq("=", $.p)))), optional(seq(", ", "..")), "}"), 
      seq("<", $.p_val, ":", $.ty_val, ">"), 

      $.id, 
      $.blank, 
      seq("(", $.p, ")"), 
      seq("(", $.p_val, ":", $.ty_val, ")"), 
      seq("(", ")"), 
      seq("(", ";", ")"), 
      seq("{", "}"), 

      prec.left(1, seq($.id, ".", $.p_val)), 
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
