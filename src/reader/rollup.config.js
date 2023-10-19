const typescript = require("@rollup/plugin-typescript");

module.exports = [
  {
    input: "./src/reader/index.ts",
    output: { dir: "./reader", format: 'cjs' },
    plugins: [
      typescript({
        tsconfig: "./src/reader/tsconfig.json",
      }),
    ],
  },
];
