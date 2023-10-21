import typescript from "@rollup/plugin-typescript";

export default [
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
