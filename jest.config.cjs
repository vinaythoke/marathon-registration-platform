// @ts-check

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock certain UI component dependencies
    '^@/components/ui/dropdown-menu$': '<rootDir>/src/__mocks__/dropdown-menu.js',
    '^@/components/ui/button$': '<rootDir>/src/__mocks__/button.js',
    '^@/components/ui/badge$': '<rootDir>/src/__mocks__/badge.js'
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.ts',
    '<rootDir>/src/**/__tests__/**/*.test.tsx',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.test.tsx'
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ]
};

module.exports = config; 