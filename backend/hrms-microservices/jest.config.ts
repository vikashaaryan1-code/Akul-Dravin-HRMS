import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
  // Unit tests: *.spec.ts (exclude integration)
  testMatch: ['**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '\\.e2e-spec\\.ts$'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        diagnostics: false, // prevents ts-jest from re-running full type check
      },
    ],
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.e2e-spec.ts',
    '!src/main.ts',
    '!src/database/seed.ts',
    '!src/database/harden-security.ts',
    '!src/**/*.entity.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.module.ts',
    '!src/**/*.controller.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    // Global thresholds start at 0 — will increase module-by-module as coverage grows.
    // Currently only 2 spec files exist; gating on a global % would be misleading.
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
};

export default config;
