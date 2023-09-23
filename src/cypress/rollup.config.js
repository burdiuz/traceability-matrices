const typescript = require("@rollup/plugin-typescript");

module.exports = [
  {
    input: "./src/cypress/index.ts",
    output: { dir: "./cypress", format: "es" },
    plugins: [
      typescript({
        tsconfig: "./src/cypress/tsconfig.json",
      }),
    ],
  },
];
