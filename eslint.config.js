"use strict";
import js from "@eslint/js";
import globals from "globals";
import stylistic from "@stylistic/eslint-plugin";
import jsdoc from "eslint-plugin-jsdoc";
import node from "eslint-plugin-node";
import chaiFriendly from "eslint-plugin-chai-friendly";
import vue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";

const jsdocRules = {
  "jsdoc/require-jsdoc": ["warn", { enableFixer: false }],
  "jsdoc/require-param": ["warn", { enableFixer: false }],
  "jsdoc/require-param-description": "warn",
  "jsdoc/require-param-name": "warn",
  "jsdoc/require-param-type": "warn",
  "jsdoc/require-hyphen-before-param-description": [
    "warn",
    "always"
  ],
  "jsdoc/require-returns": "warn",
  "jsdoc/require-returns-check": "error"
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
  jsdoc.configs["flat/recommended"],
  stylistic.configs["disable-legacy"],
  ...vue.configs["flat/recommended"],
  stylistic.configs.customize({
    indent: 2,
    quotes: "double",
    semi: true,
    arrowParens: true
  }),
  {
    ignores: ["node_modules/", "server/app/public/", "documentMD/"]
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
      vue
    }
  },
  {
    files: ["server/app/**/*.js", "server/bin/*.js", "common/*.cjs"],
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
      "node/exports-style": [
        "error",
        "module.exports"
      ]
    }
  },
  {
    files: ["server/test/**/*.{cjs,js}"],
    plugins: {
      node,
      chaiFriendly
    },
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.nodeBuiltin,
        ...globals.node,
        ...globals.mocha
      }
    }
  },
  {
    files: ["test/**/*.js"],
    plugins: {
      chaiFriendly
    },
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.nodeBuiltin,
        ...globals.node,
        ...globals.mocha,
        cy: "readonly",
        Cypress: "readonly"
      }
    }
  },
  {
    files: ["test/**/*.cjs"],
    plugins: {
      chaiFriendly
    },
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.nodeBuiltin,
        ...globals.node,
        ...globals.mocha,
        cy: "readonly",
        Cypress: "readonly"
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
      ...styleRules,
      ...jsdocRules,
      "vue/multi-word-component-names": "off",
      "vue/valid-v-slot": ["error", {
        allowModifiers: true
      }],
      "vue/require-explicit-emits": "error",
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
