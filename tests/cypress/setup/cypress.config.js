const path = require("node:path");
const { defineConfig } = require("cypress");
const webpackPreprocessor = require("@cypress/webpack-preprocessor");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here

      const options = webpackPreprocessor.defaultOptions;
      options.webpackOptions.resolve = Object.assign(
        options.webpackOptions.resolve || {},
        {
          symlinks: true,
          alias: {
            "@actualwave/traceability-matrices/cypress": path.resolve(
              __dirname,
              "../../../cypress"
            ),
          },
        }
      );

      on("file:preprocessor", webpackPreprocessor(options));
    },
    env: {
      TRACE_RECORDS_DATA_DIR: "coverage",
    },
  },
});
