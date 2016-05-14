import { parse, expand } from "../src/sweet";
import expect from "expect.js";
import { expr, stmt, items, testParse, testEval } from "./assertions";
import test from 'ava';


test('should parse an import with a single named import', () => {
  testParse('import { map } from "ramda";', items, [
        {
          "type": "Import",
          "loc": null,
          "defaultBinding": null,
          "namedImports": [
            {
              "type": "ImportSpecifier",
              "loc": null,
              "name": null,
              "binding": {
                "type": "BindingIdentifier",
                "loc": null,
                "name": "map"
              }
            }
          ],
          "moduleSpecifier": "ramda"
        }
      ]);
});

test('should parse an import for macros', () => {
  testParse('import { x } from "m" for syntax;', items, [
        {
          "type": "Import",
          "loc": null,
          "defaultBinding": null,
          "forSyntax": true,
          "namedImports": [
            {
              "type": "ImportSpecifier",
              "loc": null,
              "name": null,
              "binding": {
                "type": "BindingIdentifier",
                "loc": null,
                "name": "x"
              }
            }
          ],
          "moduleSpecifier": "m"
        }
      ]);
});

test('should parse an export of a syntax decl', () => {
  testParse('export syntaxrec m = function () {}', items, [
        {
          "type": "Export",
          "loc": null,
          "declaration": {
              "type": "VariableDeclaration",
              "loc": null,
              "kind": "syntaxrec",
              "declarators": [
                {
                  "type": "VariableDeclarator",
                  "loc": null,
                  "binding": {
                    "type": "BindingIdentifier",
                    "loc": null,
                    "name": "<<hygiene>>"
                  },
                  "init": {
                    "type": "FunctionExpression",
                    "loc": null,
                    "isGenerator": false,
                    "name": null,
                    "params": {
                      "type": "FormalParameters",
                      "loc": null,
                      "items": [],
                      "rest": null
                    },
                    "body": {
                      "type": "FunctionBody",
                      "loc": null,
                      "directives": [],
                      "statements": []
                    }
                  }
                }
              ]
            }
        }
      ]);
});

test('should parse an export of a var decl', () => {
  testParse('export var x = function () {}', items, [
      {
        "type": "Export",
        "loc": null,
        "declaration": {
            "type": "VariableDeclaration",
            "loc": null,
            "kind": "var",
            "declarators": [
              {
                "type": "VariableDeclarator",
                "loc": null,
                "binding": {
                  "type": "BindingIdentifier",
                  "loc": null,
                  "name": "<<hygiene>>"
                },
                "init": {
                  "type": "FunctionExpression",
                  "loc": null,
                  "isGenerator": false,
                  "name": null,
                  "params": {
                    "type": "FormalParameters",
                    "loc": null,
                    "items": [],
                    "rest": null
                  },
                  "body": {
                    "type": "FunctionBody",
                    "loc": null,
                    "directives": [],
                    "statements": []
                  }
                }
              }
            ]
          }
      }
    ]);
});

test('should parse an export of a function decl', () => {
  testParse('export function f() {}', items, [
    {
      "type": "Export",
      "loc": null,
      "declaration": {
        "type": "FunctionDeclaration",
        "loc": null,
        "isGenerator": false,
        "name": {
          "type": "BindingIdentifier",
          "loc": null,
          "name": "<<hygiene>>"
        },
        "params": {
          "type": "FormalParameters",
          "loc": null,
          "items": [],
          "rest": null
        },
        "body": {
          "type": "FunctionBody",
          "loc": null,
          "directives": [],
          "statements": []
        }
      }
    }
    ]);
});

test('should load a simple syntax transformer', () => {
  let loader = {
    "./m.js": `#lang "sweet.js";\nexport syntaxrec m = function (ctx) {
return syntaxQuote\`42\`;
}`
  };
  testParse('import { m } from "./m.js"; m', items, [
        {
        "type": "Import",
        "loc": null,
        "defaultBinding": null,
        "namedImports": [
          {
            "type": "ImportSpecifier",
            "loc": null,
            "name": null,
            "binding": {
              "type": "BindingIdentifier",
              "loc": null,
              "name": "m"
            }
          }
        ],
        "moduleSpecifier": "./m.js",
        "forSyntax": false
      },
      {
        "type": "ExpressionStatement",
        "loc": null,
        "expression": {
          "type": "LiteralNumericExpression",
          "loc": null,
          "value": 42
        }
      }
    ], loader);
});

test('should load a simple syntax transformer but leave runtime imports', () => {
  let loader = {
    "./x.js": `export var x = 42;`,
    "./m.js": `#lang "sweet.js";\nexport syntaxrec m = function (ctx) {
return syntaxQuote\`42\`;
}`
  };

  testParse(`
    import { m } from "./m.js";
    import { x } from "./x.js"; m`, items,  [{
        "type": "Import",
        "loc": null,
        "defaultBinding": null,
        "namedImports": [
          {
            "type": "ImportSpecifier",
            "loc": null,
            "name": null,
            "binding": {
              "type": "BindingIdentifier",
              "loc": null,
              "name": "m"
            }
          }
        ],
        "moduleSpecifier": "./m.js"
      },
      {
        "type": "Import",
        "loc": null,
        "defaultBinding": null,
        "namedImports": [
          {
            "type": "ImportSpecifier",
            "loc": null,
            "name": null,
            "binding": {
              "type": "BindingIdentifier",
              "loc": null,
              "name": "x"
            }
          }
        ],
        "moduleSpecifier": "./x.js"
      },
      {
        "type": "ExpressionStatement",
        "loc": null,
        "expression": {
          "type": "LiteralNumericExpression",
          "loc": null,
          "value": 42
        }
      }
    ], loader);
});


test('importing for syntax works', () => {
  let loader = {
    './id.js': `#lang 'base';
      export var id = function (x) {
        return x;
      }
    `
  };
  testEval(`
    import { id } from './id.js' for syntax;

    syntax m = ctx => {
      id(42);
      return #\`1\`;
    }
    output = m;
  `, 1, loader);
});
