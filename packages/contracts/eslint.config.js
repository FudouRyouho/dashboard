import { baseConfig } from '../../eslint.config.mjs';

// contracts must not depend on @dashboard/integrations: integrations consumes
// contracts, so the import would cycle the dependency graph.
export default [
  ...baseConfig,
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@dashboard/integrations', '@dashboard/integrations/*'],
              message:
                'contracts must not import from @dashboard/integrations: integrations consumes contracts. Define the shared type in contracts itself.',
            },
          ],
        },
      ],
    },
  },
];
