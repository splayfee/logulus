const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: [
      '**/__MACOSX/**',
      '**/coverage/**',
      '**/docs/**',
      '**/logs/**',
      '**/node_modules/**'
    ]
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.es2024,
        ...globals.mocha
      }
    },
    rules: {
      'block-scoped-var': 'error',
      'brace-style': ['error', '1tbs'],
      'consistent-return': 'error',
      'curly': 'error',
      'eol-last': 'off',
      'keyword-spacing': 'error',
      'no-else-return': 'error',
      'no-eq-null': 'error',
      'no-floating-decimal': 'error',
      'no-lonely-if': 'error',
      'no-nested-ternary': 'error',
      'no-path-concat': 'error',
      'no-redeclare': 'error',
      'no-self-compare': 'error',
      'no-trailing-spaces': 'error',
      'no-undef': 'off',
      'no-underscore-dangle': 'off',
      'no-unused-vars': ['error', { args: 'none', vars: 'all' }],
      'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
      'quotes': ['warn', 'double', { avoidEscape: true }],
      'radix': 'error',
      'semi': ['error', 'always'],
      'semi-spacing': 'error',
      'sort-vars': 'error',
      'space-unary-ops': 'error',
      'strict': ['error', 'global'],
      'wrap-iife': ['error', 'inside']
    }
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2024,
        ...globals.vitest
      }
    }
  }
];
