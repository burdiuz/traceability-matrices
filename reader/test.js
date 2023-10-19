const { readCoverage } = require("./index.js");

const globals = {};

readCoverage(
  ["./coverage"],
  globals
).then(({ features, files, roots }) => {
  console.log(globals);
});
