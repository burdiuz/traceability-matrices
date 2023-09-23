const commonjs = require("@rollup/plugin-commonjs");
const resolve = require("@rollup/plugin-node-resolve");

module.exports = [
  {
    input: "./src/parsers/markdown.js",
    output: { file: "./markdown.js", format: "es" },
    plugins: [resolve(), commonjs()],
    external: [
      "@actualwave/traceability-matrices",
      "@actualwave/traceability-matrices/cypress",
    ],
  },
];
