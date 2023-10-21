import typescript from "@rollup/plugin-typescript";

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
];
