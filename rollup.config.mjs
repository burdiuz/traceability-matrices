import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import copy from "rollup-plugin-copy";

const plugins = [resolve(), commonjs()];

const external = [
  "@actualwave/traceability-matrices",
  "@actualwave/traceability-matrices/cypress",
];

export default [
  {
    input: "./src/cypress/index.ts",
    output: { dir: "./cypress", format: "es" },
    plugins: [
      typescript({
        tsconfig: "./src/cypress/tsconfig.json",
      }),
    ],
  },
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
    input: "./src/parsers/xml.js",
    output: { file: "./xml.js", format: "es" },
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
  {
    input: {
      "generate-static": "./src/commands/generate-static.ts",
      lcov: "./src/commands/lcov.ts",
      serve: "./src/commands/serve.ts",
      stats: "./src/commands/stats.ts",
      threshold: "./src/commands/threshold.ts",
    },
    output: { dir: "./commands", format: "cjs" },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./src/commands/tsconfig.json",
      }),
      copy({
        targets: [
          { src: "./src/view/css", dest: "commands" },
          { src: "./src/view/icons", dest: "commands" },
          { src: "./src/view/js", dest: "commands" },
        ],
      }),
    ],
    external: ["pug", "koa", "@koa/router"],
  },
];
