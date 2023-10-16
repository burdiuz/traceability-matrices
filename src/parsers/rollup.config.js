import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";

export default [
  {
    input: "./src/parsers/markdown.js",
    output: { file: "./markdown.js", format: "es" },
    plugins: [resolve(), commonjs()],
    external: [
      "@actualwave/traceability-matrices",
      "@actualwave/traceability-matrices/cypress",
    ],
  },
  {
    input: "./src/parsers/html.js",
    output: { file: "./html.js", format: "es" },
    plugins: [resolve(), commonjs()],
    external: [
      "@actualwave/traceability-matrices",
      "@actualwave/traceability-matrices/cypress",
    ],
  },
  {
    input: "./src/parsers/json.js",
    output: { file: "./json.js", format: "es" },
    plugins: [resolve(), commonjs()],
    external: [
      "@actualwave/traceability-matrices",
      "@actualwave/traceability-matrices/cypress",
    ],
  },
];
