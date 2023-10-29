import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import copy from "rollup-plugin-copy";

export default [
  {
    input: {
      "generate-static": "./src/commands/generate-static.ts",
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
