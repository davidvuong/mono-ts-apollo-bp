module.exports = {
  preset: 'ts-jest',
  bail: true,
  verbose: true,
  testEnvironment: 'node',
  collectCoverage: false,
  testMatch: ['**/src/**/*.test.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/build/'],
  collectCoverageFrom: ['<rootDir>/src/**', '!<rootDir>/src/index.ts'],
  coveragePathIgnorePatterns: ['<rootDir>/node_modules', '<rootDir>/__tests__'],
  globalSetup: '<rootDir>/__tests__/global/setup.ts',
};
