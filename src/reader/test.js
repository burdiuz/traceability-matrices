const { readCoverage } = require("./index");

const globals = {};

readCoverage(
  ["./coverage"],
  globals
).then(({ features, files, roots }) => {
  console.log(globals);
});
