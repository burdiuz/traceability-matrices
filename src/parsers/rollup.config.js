import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";

const plugins = [resolve(), commonjs()];

const external = [
  "@actualwave/traceability-matrices",
  "@actualwave/traceability-matrices/cypress",
];

export default [
  {
    input: "./src/parsers/markdown.js",
    output: { file: "./markdown.js", format: "es" },
    plugins,
    external,
  },
  {
    input: "./src/parsers/html.js",
    output: { file: "./html.js", format: "es" },
    plugins,
    external,
  },
  {
    input: "./src/parsers/json.js",
    output: { file: "./json.js", format: "es" },
    plugins,
    external,
  },
  {
    input: "./src/parsers/yaml.js",
    output: { file: "./yaml.js", format: "es" },
    plugins,
    external,
  },
];
