"use strict";
import js from "@eslint/js";
import globals from "globals";
import jsdoc from "eslint-plugin-jsdoc";
import node from "eslint-plugin-node";
import chaiFriendly from "eslint-plugin-chai-friendly"
import vue from "eslint-plugin-vue"
import vuetify from "eslint-plugin-vuetify"
import vueParser from "vue-eslint-parser"

export default [
  js.configs.recommended,
  {
    ignores : ["./**/node_modules/", "server/app/public/*"],
  },
  {
    files:["server/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.nodeBuiltin,
        ...globals.node
      }
    }
  },
  {
    files:["client/**/*.js", "client/**/*.vue"],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    }
  },
  {
    files:["**/*.js", "**/*.vue"],
    plugins:{
      jsdoc,
    },
    linterOptions: {
      reportUnusedDisableDirectives: true
    },
    rules: {
      "jsdoc/require-hyphen-before-param-description": [
        "warn",
        "always"
      ],
      "jsdoc/require-param-description": "warn",
      "jsdoc/require-param-name": "warn",
      "jsdoc/require-param-type": "warn",
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",
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
      "require-unicode-regexp": "off",
      quotes: ["error", "double"]
    },
  },
  {
    files:["server/app/**/*.js"],
    plugins:{
      node
    },
    rules:{
      "jsdoc/require-hyphen-before-param-description": [
        "warn",
        "always"
      ],
      "jsdoc/require-param-description": "warn",
      "jsdoc/require-param-name": "warn",
      "jsdoc/require-param-type": "warn",
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",
      "node/exports-style": [
        "error",
        "module.exports"
      ],
    },
    languageOptions:{
      sourceType: "commonjs"
    },
  },
  {
    files:["server/test/**/*.js"],
    plugins:{
      node,
      chaiFriendly
    },
    languageOptions:{
      sourceType: "commonjs",
      globals:{
        it: "readonly",
        describe: "readonly",
        before: "readonly",
        after: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      },
    },
  },
  {
    files:["client/src/**/*.vue"],
    languageOptions:{
      parser: vueParser
    },
    plugins:{
      vue,
      vuetify
    }
  }
]
