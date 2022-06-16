const id_tail = "(\-?[A-Za-z0-9_\'])*";
const sym = "[~!@#$%^&*\\-=+\\.?:<>|/\\\\]+";

module.exports = grammar({
  name: 'prowl',

  extras: $ => [
    /\s/, 
    $.comment, 
  ], 

  // word: $ => [
  //   $.id
  // ], 

  inline: $ => [
    $.let_body, 
    $.parameter, 
  ],

  rules: {
    source_file: $ => seq(optional($.access), $.e),
    comb: $ => /zap|i|unit|rep|run|dup|nip|sap|dip|cat|swat|swap|cons|take|tack|sip|peek|cake|poke|dig|bury|flip|duco|rot/,
    prim: $ => /int|float|str|opt/,

    id: $ => new RegExp("[a-z]" + id_tail), 
    id_reg: $ => new RegExp("[a-z]" + id_tail + "([?+*!]|!!)?"), 
    reg_paren: $ => new RegExp("\\)" + "([?+*!]|!!)?"), 
    cap: $ => new RegExp("[A-Z]" + id_tail), 
    symbol: $ => new RegExp(sym), 
    infix_word: $ => new RegExp("<[a-z]" + id_tail + ">"), 
    stackvar: $ => new RegExp("[a-z]\\*" + id_tail), 
    blank: $ => new RegExp("_" + id_tail), 
    int: $ => /0|[1-9][0-9]*/, 
    float: $ => /[1-9]\.[0-9]*|\.[0-9]+/, 
    string: $ => /"([^"]|\\")*"/,
    suffix: $ => /[?+*!]|!!/,

    // comment: $ => token(
    //   seq("/*", choice($.comment, /(\/[^*]|[^/]\*|\*[^/]|[^*]\/)*.?/), "*/")
    // ),

    comment: $ => /\/\*(.[^/]|[^*].)*[^/]?\*\//, 

    access: $ => choice("priv", "opaq"), 
    parameter: $ => seq("[", $.stackvar, "--", $.stackvar, "]"), 

    sp: $ => choice(
      seq("type", repeat($.parameter), $.id, optional(seq("=", $.ty_val))), 
      seq("spec", $.id, ":", $.ty), 
      seq("data", repeat($.parameter), $.id, "=", $.data), 
    ), 

    ty: $ => choice(
      seq($.stackvar, repeat($.ty_val), "--", $.stackvar, repeat($.ty_val)), 
      seq(repeat($.ty_val), "--", repeat($.ty_val))
    ), 

    ty_val: $ => choice(
      $.prim, 
      $.cap, 
      $.name, 
      seq("[", $.ty, "]"), 
      seq("#[", $.ty, "]"), 
      seq("sig", repeat($.sp), "end"), 
      seq("mod", repeat($.sp), "end"), 
      seq("<", $.id, ":", $.ty_val, ">"), 
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

    operator: $ => seq("(", new RegExp("(let|and|as)?" + sym), ")"), 
    name:  $ => choice($.id, $.operator),

    s: $ => choice(
      seq(optional($.access), "type", repeat($.parameter), $.id, optional(seq("=", $.ty_val))), 
      seq(optional($.access), "data", repeat($.parameter), $.id, "=", $.data), 
      seq(optional($.access), optional("impl"), "def", repeat($.p_val), $.id, optional(seq(":", $.ty)), "=", $.e), 
      seq(optional("impl"), "open", $.e), 
      seq("mix", $.e), 
    ), 

    e: $ => choice(
      $.operator, 
      seq($.e_term, $.symbol), 
      seq($.symbol, $.e_term), 
      $.e_term, 
      $.bind, 
      seq($.e_term, $.bind), 
      seq($.e_term, $.symbol, $.bind), 
    ), 

    bind: $ => choice(
      seq($.letkw, $.let_body, repeat(seq($.andkw, $.let_body)), "->", $.e), 
      seq($.askw, repeat($.p_val), optional(seq(":", $.ty)), "->", $.e), 
    ), 

    letkw: $ => choice("let", $.letop), 
    andkw: $ => choice("and", $.andop), 
    askw:  $ => choice("as",  $.asop), 
    letop: $ => new RegExp("let" + sym), 
    andop: $ => new RegExp("and" + sym), 
    asop:  $ => new RegExp("as"  + sym), 

    let_body: $ => seq(repeat($.p_val), $.id, optional(seq(":", $.ty)), "=", $.e), 

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
      prec.left(  6, seq($.e_term, $.infix_word, $.e_term)), 
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
      $.comb,

      $.int, 
      $.float, 
      $.string, 

      seq("#[", sep1(",", $.e), "]"), 
      seq("[", $.e, "]"), 
      seq("[", "]"), 
      $.id_reg, 

      $.cap, 
      seq("{", optional(seq("mix", $.e, ",")), sep1(",", seq($.id, optional(seq("=", $.e)))), "}"), 
      seq("mod", repeat($.s), "end"), 

      seq("(", sep1(";", sep1(",", $.e)), $.reg_paren), 
      seq("(", $.reg_paren), 

      prec.right(1, seq("&", $.e_val)),
      prec.right(1, seq("!", $.e_val)),

      prec.left(2, seq($.e_val, ".", $.e_val)), 
      prec.left(2, seq($.e_val, ":", $.e_val)), 
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
      
      seq("#[", sep1(",", $.p), "]"), 
      seq("[", $.p, "]"), 
      seq("[]"), 

      $.cap, 
      seq("{", sep1(", ", seq($.id, optional(seq("=", $.p)))), optional(seq(", ", "..")), "}"), 
      seq("<", $.p_val, ":", $.ty_val, ">"), 

      $.id, 
      $.blank, 
      seq("(", $.p, ")"), 
      seq("(", $.p_val, ":", $.ty_val, ")"), 

      prec.left(1, seq($.id, ".", $.p_val)), 
    ), 
  }
});

function sep1(delimiter, rule) {
  return seq(
    optional(delimiter), 
    rule, 
    repeat(seq(delimiter, rule)), 
    optional(delimiter)
  )
}
