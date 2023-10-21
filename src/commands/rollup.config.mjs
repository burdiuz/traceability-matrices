import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";

const plugins = [
  resolve(),
  commonjs(),
  typescript({
    tsconfig: "./src/commands/tsconfig.json",
  }),
];

export default [
  {
    input: "./src/commands/threshold.ts",
    output: { dir: "./commands", format: "cjs" },
    plugins,
  },
];
