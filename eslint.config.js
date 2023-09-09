"use strict";
import js from "@eslint/js";
import jsdoc from "eslint-plugin-jsdoc";
import node from "eslint-plugin-node";
import chaiExpect from "eslint-plugin-chai-expect"
import chaiFriendly from "eslint-plugin-chai-friendly"
import vue from "eslint-plugin-vue"
import vuetify from "eslint-plugin-vuetify"

export default [
  js.configs.recommended,
  {
    files:["server/app/**/*.js"],
    ignores:["server/app/public/*"],
    plugins:{
      jsdoc,
      node
    },
    languageOptions:{
      sourceType: "commonjs"
    },
  },
  {
    files:["server/test/**/*.js"],
    plugins:{
      jsdoc,
      node,
      chaiExpect,
      chaiFriendly
    },
    languageOptions:{
      sourceType: "commonjs"
    },
  },
  {
    files:["client/src/**/*.{js,vue}"],
    plugins:{
      jsdoc,
      vue,
      vuetify
    }
  },
  {
    files:["./**/*.{js,vue}"],
    ignores:["./*/node_modules/**/*", "./node_modules"],
linterOptions: {
            reportUnusedDisableDirectives: true
        },
    rules: {
    "no-nested-ternary": "off",
    "no-param-reassign": "warn",
    "arrow-parens": [
      "error",
      "always"
    ],
    "arrow-body-style": [
      "error",
      "always"
    ],
    "arrow-spacing": [
      "error",
      {
        "before": false,
        "after": false
      }
    ],
    "camelcase": [
      "error",
      {
        "properties": "never"
      }
    ],
    "eqeqeq": [
      "error",
      "always",
      {
        "null": "ignore"
      }
    ],
    "func-style": [
      "error",
      "declaration",
      {
        "allowArrowFunctions": true
      }
    ],
    "indent": [
      "error",
      2,
      {
        "SwitchCase": 1
      }
    ],
    "lines-around-comment": [
      "error",
      {
        "beforeBlockComment": true,
        "beforeLineComment": false
      }
    ],
    "lines-between-class-members": [
      "error",
      "always",
      {
        "exceptAfterSingleLine": true
      }
    ],
    "newline-per-chained-call": "error",
    "no-use-before-define": [
      "error",
      {
        "functions": false
      }
    ],
    "no-warning-comments": "warn",
    "padded-blocks": [
      "error",
      "never"
    ],
    "padding-line-between-statements": [
      "error",
      {
        "blankLine": "any",
        "prev": [
          "const",
          "let",
          "var"
        ],
        "next": "*"
      },
      {
        "blankLine": "always",
        "prev": "*",
        "next": [
          "block-like",
          "class",
          "do",
          "for",
          "function",
          "multiline-block-like",
          "switch",
          "try",
          "while"
        ]
      },
      {
        "blankLine": "any",
        "prev": [
          "const",
          "let",
          "var",
          "for",
          "while",
          "do",
          "block-like",
          "multiline-block-like"
        ],
        "next": [
          "block-like",
          "do",
          "for",
          "multiline-block-like",
          "switch",
          "try",
          "while"
        ]
      }
    ],
    "spaced-comment": [
      "error",
      "never"
    ],
    "node/exports-style": [
      "error",
      "module.exports"
    ],
    "require-unicode-regexp": "off",
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
  },
  }
]
