"use strict";
import js from "@eslint/js";
import globals from "globals";
import stylistic from "@stylistic/eslint-plugin";
import jsdoc from "eslint-plugin-jsdoc";
import node from "eslint-plugin-node";
import chaiFriendly from "eslint-plugin-chai-friendly";
import vue from "eslint-plugin-vue";
import vuetify from "eslint-plugin-vuetify";
import vueParser from "vue-eslint-parser";

const jsdocRules = {
  "jsdoc/require-hyphen-before-param-description": [
    "warn",
    "always"
  ],
  "jsdoc/require-param-description": "warn",
  "jsdoc/require-param-name": "warn",
  "jsdoc/require-param-type": "warn",
  "jsdoc/require-jsdoc": "off",
  "jsdoc/require-param": "off",
  "jsdoc/require-returns": "off"
};

const styleRules = {
  "@stylistic/arrow-spacing": [
    "error",
    {
      after: false,
      before: false
    }],
  "@stylistic/comma-dangle": [
    "error",
    "never"
  ],
  "@stylistic/spaced-comment": [
    "error",
    "never"
  ],
  "@stylistic/lines-around-comment": [
    "error",
    {
      beforeBlockComment: true,
      afterBlockComment: false,
      beforeLineComment: false,
      afterLineComment: false,
      allowBlockStart: true
    }
  ],
  "@stylistic/lines-between-class-members": [
    "error",
    "always",
    {
      exceptAfterSingleLine: true
    }
  ],
  "@stylistic/newline-per-chained-call": [
    "error",
    {
      ignoreChainWithDepth: 2
    }
  ],
  "@stylistic/padded-blocks": [
    "error",
    "never"
  ],
  "@stylistic/brace-style": [
    "error",
    "1tbs",
    {
      allowSingleLine: true
    }
  ],
  "@stylistic/padding-line-between-statements": [
    "error",
    {
      blankLine: "any",
      prev: [
        "const",
        "let",
        "var"
      ],
      next: "*"
    },
    {
      blankLine: "always",
      prev: "*",
      next: [
        "class",
        "do",
        "for",
        "function",
        "switch",
        "try",
        "while"
      ]
    },
    {
      blankLine: "any",
      prev: [
        "const",
        "let",
        "var",
        "for",
        "while",
        "do",
        "block-like",
        "multiline-block-like"
      ],
      next: [
        "block-like",
        "do",
        "for",
        "multiline-block-like",
        "switch",
        "try",
        "while"
      ]
    }
  ]
};

export default [
  js.configs.recommended,
  stylistic.configs["disable-legacy"],
  stylistic.configs.customize({
    indent: 2,
    quotes: "double",
    semi: true,
    arrowParens: true
  }),
  {
    ignores: ["node_modules/", "server/app/public/", "test/", "documentMD/"]
  },
  {
    files: ["client/**/*.js", "client/**/*.vue"],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    }
  },
  {
    files: ["client/src/**/*.vue"],
    languageOptions: {
      parser: vueParser
    },
    plugins: {
      vue,
      vuetify
    }
  },
  {
    files: ["server/app/**/*.js", "server/bin/*.js"],
    plugins: {
      node
    },
    languageOptions: {
      globals: {
        ...globals.nodeBuiltin,
        ...globals.node
      },
      sourceType: "commonjs"
    },
    rules: {
      ...jsdocRules,
      "node/exports-style": [
        "error",
        "module.exports"
      ]
    }
  },
  {
    files: ["server/test/**/*.js"],
    plugins: {
      node,
      chaiFriendly
    },
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.nodeBuiltin,
        ...globals.node,
        it: "readonly",
        describe: "readonly",
        before: "readonly",
        after: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly"
      }
    }
  },
  {
    files: ["*.js", "**/*.js", "**/*.vue"],
    plugins: {
      "@stylistic": stylistic,
      jsdoc
    },
    linterOptions: {
      reportUnusedDisableDirectives: true
    },
    rules: {
      ...jsdocRules,
      ...styleRules,
      "no-nested-ternary": "off",
      "no-param-reassign": "warn",
      "camelcase": [
        "error",
        {
          properties: "never"
        }
      ],
      "eqeqeq": [
        "error",
        "always",
        {
          null: "ignore"
        }
      ],
      "func-style": [
        "error",
        "declaration",
        {
          allowArrowFunctions: true
        }
      ],
      "no-use-before-define": [
        "error",
        {
          functions: false
        }
      ],
      "no-warning-comments": "warn",
      "require-unicode-regexp": "off"
    }
  }
];
