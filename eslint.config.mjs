import stylistic from '@stylistic/eslint-plugin';
import jsonc from 'eslint-plugin-jsonc';
import * as jsoncParser from 'jsonc-eslint-parser';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: ['dist/**', 'node_modules/**']
    },
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
        languageOptions: {
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module'
            }
        },
        linterOptions: {
            reportUnusedDisableDirectives: 'error'
        },
        plugins: {
            '@stylistic': stylistic
        },
        rules: {
            '@stylistic/indent': ['error', 4, { SwitchCase: 1 }],
            '@stylistic/indent-binary-ops': ['error', 4],
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    fixStyle: 'separate-type-imports'
                }
            ],
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_'
                }
            ],
            'curly': ['error', 'all'],
            'eqeqeq': ['error', 'always'],
            'no-console': ['error', { allow: ['warn', 'error'] }],
            'no-debugger': 'error',
            'no-var': 'error',
            'object-shorthand': ['error', 'always'],
            'prefer-const': 'error'
        }
    },
    {
        files: ['src/generated/**/*.ts'],
        rules: {
            '@typescript-eslint/consistent-type-imports': 'off'
        }
    },
    {
        files: ['test/**/*.{ts,mts,cts}', '**/*.test.{ts,mts,cts}', 'vitest.config.ts'],
        rules: {
            'no-console': 'off'
        }
    },
    {
        files: ['**/*.json'],
        languageOptions: {
            parser: jsoncParser
        },
        plugins: {
            jsonc
        },
        rules: {
            'jsonc/indent': ['error', 4]
        }
    }
);
