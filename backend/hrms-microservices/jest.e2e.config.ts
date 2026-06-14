import type { Config } from 'jest';

/**
 * INTEGRATION TEST CONFIG
 * Separate config for e2e/integration tests to avoid mixing with unit test runs.
 * Run with: npm run test:e2e
 * Uses SQLite :memory: — no Docker or external DB required.
 */
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
  testMatch: ['**/*.e2e-spec.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        diagnostics: false,
      },
    ],
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  // Integration tests need longer timeouts (DB setup, queue processing)
  testTimeout: 30000,
  // No coverage for integration tests — unit tests own coverage
  collectCoverage: false,
};

export default config;
