import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // ── TypeScript strictness ──────────────────────────────────────────────

      // Forbid `any`. Use `unknown` at boundaries, then narrow.
      '@typescript-eslint/no-explicit-any': 'error',
      'react-refresh/only-export-components': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',

      // Unsafe casts silently lie to the compiler — allowed only in src/mappers/
      // (enforced below via an override that sets this back to 'warn' in mappers).
      'no-restricted-syntax': [
        'error',
        {
          // Catch `as unknown as Foo` outside mapper files.
          // Components and pages must not do boundary casts.
          selector:
            "TSAsExpression > TSAsExpression[typeAnnotation.typeName.name='unknown']",
          message:
            'Double cast (as unknown as T) is only allowed in src/mappers/. ' +
            'Add a proper typed mapper instead.',
        },
      ],

      // ── Architecture boundaries ────────────────────────────────────────────

      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // Components must not reach into pages/ for types.
              // Types belong in src/types/ or src/features/*/index.ts.
              group: ['*/pages/*'],
              importNamePattern: '^[A-Z]',   // catches type-only named imports like Poll, Conversation
              message:
                'Do not import types from a page. Move the type to src/types/ ' +
                'or re-export it from the matching src/features/*/index.ts.',
            },
          ],
        },
      ],
    },
  },

  // ── Mapper exemptions ────────────────────────────────────────────────────
  // Mappers are the explicit DB boundary — double casts are expected there.
  {
    files: ['src/mappers/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },

  {
    files: ['src/pages/ClubChat.tsx', 'src/hooks/useClubData.ts', 'src/sections/DiscoveryPreview.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // ── Test file exemptions ─────────────────────────────────────────────────
  // Tests often need to cast partial fixtures; relax `any` ban there.
  {
    files: ['src/**/__tests__/**/*.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-restricted-syntax': 'off',
    },
  },
])
