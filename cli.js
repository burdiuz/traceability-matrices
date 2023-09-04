#!/usr/bin/env node
"use strict";

const path = require("path");
const fs = require("fs");

const parseArgs = () => {
  /*
   * 0 - node
   * 1 - this file name
   * 2 - command
   * 3... - arguments
   */
  const [interpreter, executable, command] = process.argv;
  const args = {};
  for (let index = 3; index < process.argv.length; ++index) {
    // all arguments have same shape, always have name and value
    const parsed = process.argv[index].match(/^--([^=]+)=(.+)$/);

    // misshaped argument breaks command line reading
    if (!parsed) {
      break;
    }

    const [, name, value] = parsed;
    if (args.hasOwnProperty(name)) {
      args[name].push(value);
    } else {
      args[name] = [value];
    }
  }

  return { command, args };
};

const { command, args } = parseArgs();

let targetDirs = args["target-dir"] || [];
// validate target first, must be at least one, all must be dirs
const exitWithError = (message) => {
  console.error(message);
  process.exit(1);
};

if (!targetDirs.length) {
  exitWithError(
    "No target directories were provided, please use --target-dir argument to specify at least one target directory."
  );
}

targetDirs = targetDirs.map((target) => {
  const fullPath = path.resolve(process.cwd(), String(target));

  if (!fullPath) {
    exitWithError(`Path "${target}" could not be resolved.`);
  }

  if (!fs.existsSync(fullPath)) {
    exitWithError(`Target directory "${fullPath}" does not exist.`);
  }

  return fullPath;
});

// TM char codes 84 and 77
const DEFAULT_PORT = 8477;

let projectTableType = "default";

if (String(args.compact) === "true") {
  projectTableType = "compact";
}

switch (command) {
  case "serve":
    {
      /**
       * serve --target-dir= --port= --https=true --compact=true
       */
      const port = args.port ? parseInt(String(args.port), 10) : DEFAULT_PORT;
      const useHttps = String(args.https) === "true";

      if (Number.isNaN(port)) {
        exitWithError(`Port value "${args.port}" results to NaN.`);
      }

      const { serve } = require("./commands/serve.js");

      serve(targetDirs, port, useHttps, projectTableType).then(() => {
        import("open").then(({ default: open }) =>
          open(
            useHttps ? `https://localhost:${port}` : `http://localhost:${port}`
          )
        );
      });
    }
    break;
  case "generate":
    {
      /**
       * generate --target-dir= --output-dir= --compact=true
       */
      const outputDir = path.resolve(process.cwd(), String(args["output-dir"]));

      if (fs.existsSync(outputDir)) {
        if (!fs.statSync(outputDir).isDirectory()) {
          exitWithError(`"${outputDir}" exists and is not a directory.`);
        }

        if (args["force-cleanup"]) {
          fs.rmSync(outputDir, { recursive: true, force: true });
        }
      } else {
        fs.mkdirSync(outputDir);
      }

      const { generateStatic } = require("./commands/generate-static.js");

      generateStatic(targetDirs, outputDir, projectTableType);
    }
    break;
  case "threshold":
    {
      // threshold --target-dir= --total=80 --per-project=40
      const total =
        args["total"] === undefined ? 100 : parseInt(args["total"], 10);
      const perProject =
        args["per-project"] === undefined
          ? 100
          : parseInt(args["per-project"], 10);

      if (isNaN(total) || isNaN(perProject)) {
        exitWithError(
          "Coverage thresholds should be positive integer values between 0 and 100."
        );
      }

      const { threshold } = require("./commands/threshold.js");

      threshold(targetDirs, total, perProject);
    }
    break;
  case "stats":
    {
      // stats --target-dir= --project=

      const projects = args["project"] || [];

      const { stats } = require("./commands/stats.js");

      stats(targetDirs, projects);
    }
    break;
  case "help":
    // TODO
    break;
}
