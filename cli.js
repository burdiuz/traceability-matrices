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
    const parsed = process.argv[index].match(/^--([^=]+)=(.*)$/);

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

let feaureTableType = "default";

if (String(args.compact) === "true") {
  feaureTableType = "compact";
}

switch (command) {
  case "serve":
    {
      /**
       * serve --target-dir= --port= --key= --cert= --compact=true
       */
      const port = args.port ? parseInt(String(args.port), 10) : DEFAULT_PORT;
      let keyFilePath = (args.key || [])[0];
      let certFilePath = (args.cert || [])[0];
      let useHttps = false;

      if (Number.isNaN(port)) {
        exitWithError(`Port value "${args.port}" results to NaN.`);
      }

      if (keyFilePath || certFilePath) {
        if (!keyFilePath || !certFilePath) {
          exitWithError(
            `Parameters "--key" and "--cert" are both required for HTTPS server and must point to corresponding files.`
          );
        }

        keyFilePath = path.resolve(process.cwd(), keyFilePath);

        if (
          !keyFilePath ||
          !fs.existsSync(keyFilePath) ||
          !fs.statSync(keyFilePath).isFile()
        ) {
          exitWithError(
            `Parameter "--key" must point at file with private key for certificate.`
          );
        }

        certFilePath = path.resolve(process.cwd(), certFilePath);

        if (
          !certFilePath ||
          !fs.existsSync(certFilePath) ||
          !fs.statSync(certFilePath).isFile()
        ) {
          exitWithError(
            `Parameter "--cert" must point at file with signed certificate.`
          );
        }

        useHttps = true;
      }

      const { serve } = require("./commands/serve.js");

      serve(targetDirs, port, keyFilePath, certFilePath, feaureTableType).then(
        () => {
          import("open").then(({ default: open }) =>
            open(
              useHttps
                ? `https://localhost:${port}`
                : `http://localhost:${port}`
            )
          );
        }
      );
    }
    break;
  case "generate":
    {
      /**
       * generate --target-dir= --output-dir= --compact=true --force-cleanup=true
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

      generateStatic(targetDirs, outputDir, feaureTableType);
    }
    break;
  case "lcov":
    {
      /**
       * lcov --target-dir= --output-dir= --relative-dir= --force-cleanup=true
       */
      const outputDir = path.resolve(process.cwd(), String(args["output-dir"]));

      if (fs.existsSync(outputDir)) {
        if (!fs.statSync(outputDir).isDirectory()) {
          exitWithError(`"${outputDir}" exists and is not a directory.`);
        }

        if (args["force-cleanup"]) {
          fs.rmSync(join(outputDir, "lcov"), { recursive: true, force: true });
        }
      } else {
        fs.mkdirSync(outputDir);
      }

      const relativeDir = args["relative-dir"]
        ? String(args["relative-dir"])
        : undefined;

      const { lcov } = require("./commands/lcov.js");

      lcov(targetDirs, outputDir, relativeDir);
    }
    break;
  case "threshold":
    {
      // threshold --target-dir= --total=80 --per-feature=40
      const total =
        args["total"] === undefined ? 100 : parseInt(args["total"], 10);
      const perFeature =
        args["per-feature"] === undefined
          ? 100
          : parseInt(args["per-feature"], 10);

      if (isNaN(total) || isNaN(perFeature)) {
        exitWithError(
          "Coverage thresholds should be positive integer values between 0 and 100."
        );
      }

      const { threshold } = require("./commands/threshold.js");

      threshold(targetDirs, total, perFeature);
    }
    break;
  case "stats":
    {
      // stats --target-dir= --feature=

      const features = args["feature"] || [];

      const { stats } = require("./commands/stats.js");

      stats(targetDirs, features);
    }
    break;
  case "help":
    // TODO
    break;
}
