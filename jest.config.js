module.exports = {
  rootDir: __dirname,
  testMatch: ["<rootDir>/src/**/__tests__/*.spec.{t,j}s"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  injectGlobals: false,
  collectCoverage: true,
  coverageReporters: ["text", "html"],
  collectCoverageFrom: [
    "<rootDir>/src/**/*.{t,j}s",
    "!**/node_modules/**",
    "!**/.history/**",
  ],
};
