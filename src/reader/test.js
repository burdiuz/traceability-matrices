const { readCoverage } = require("./reader");

const globals = {};

readCoverage(
  ["./coverage/cypress/e2e/test_categories.cy.js.json"],
  globals
).then(({ features, files, roots }) => {
  console.log(globals);
});
