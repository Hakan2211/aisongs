//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  {
    ignores: [
      '.output/**',
      '.nitro/**',
      'node_modules/**',
      'src/generated/**',
      // Shadcn UI components are auto-generated and shouldn't be linted strictly
      'src/components/ui/calendar.tsx',
      'src/components/ui/chart.tsx',
      'src/components/ui/sidebar.tsx',
    ],
  },
  ...tanstackConfig,
]
