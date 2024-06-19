import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import copy from "rollup-plugin-copy";

const plugins = [resolve(), commonjs()];

const external = [
  "@actualwave/traceability-matrices",
  "@actualwave/traceability-matrices/cypress",
  "./cypress",
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
    input: "./src/cypress/index.ts",
    output: { dir: "./commands/parsers/cypress", format: "cjs" },
    plugins: [typescript()],
  },
  ...["html", "json", "markdown", "xml", "yaml"]
    .map((parser) => [
      {
        input: `./src/parsers/${parser}.js`,
        output: { file: `./${parser}.js`, format: "es" },
        plugins,
        external,
      },
      {
        input: `./src/parsers/${parser}.js`,
        output: { file: `./commands/parsers/${parser}.js`, format: "cjs" },
        plugins,
        external,
      },
    ])
    .flat(),
  {
    input: {
      "generate-static": "./src/commands/generate-static.ts",
      lcov: "./src/commands/lcov.ts",
      serve: "./src/commands/serve.ts",
      stats: "./src/commands/stats.ts",
      threshold: "./src/commands/threshold.ts",
      scan_features: "./src/commands/scan_features.ts",
      help: "./src/commands/help.ts",
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
    external: [
      "pug",
      "koa",
      "@koa/router",
      "./parsers/html.js",
      "./parsers/json.js",
      "./parsers/markdown.js",
      "./parsers/xml.js",
      "./parsers/yaml.js",
    ],
  },
];
