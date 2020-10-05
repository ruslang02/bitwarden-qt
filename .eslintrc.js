module.exports = {
  env: {
    es2020: true,
    node: true,
  },
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    project: 'tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    "@typescript-eslint/indent": [
        "error",
        4,
        {
            "ObjectExpression": "first"
        }
    ],
    '@typescript-eslint/no-shadow': ['error'],
    '@typescript-eslint/no-unused-vars': ['error'],
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'no-bitwise': 'off',
    'no-empty': 'off',
    'no-shadow': 'off',
    'no-restricted-syntax': 'off',
    'no-underscore-dangle': 'off',
    'no-unused-vars': 'off'
  },
  settings: {
    'import/resolver': {
      node: {
        paths: ['src', 'node_modules'],
        extensions: ['.js', '.json', '.ts'],
      }
    },
  }
};
