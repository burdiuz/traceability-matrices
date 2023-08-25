module.exports = {
  rootDir: __dirname,
  testMatch: ['<rootDir>/__tests__/**/*.spec.js'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  injectGlobals: false,
  collectCoverage: true,
  coverageReporters: ["text"],
  collectCoverageFrom: ["<rootDir>/cypress.js", "!**/node_modules/**", "!**/.history/**"],
};
