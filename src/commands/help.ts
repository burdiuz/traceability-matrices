const generateStatic = () => console.log(`
traceability-matrices generate --target-dir= --output-dir= [--compact=true] [--force-cleanup=true]

Generate static HTML files with coverage reports.

Parameters:
--target-dir - Required, path to directory with coverage reports.
--output-dir - Required, path to folder where generated HTML files should be stored
--compact=true - Optional, uses compact variant of HTML table, categories displayed as rows instead of columns. Default value is false. Might be preferable way of rendering features with deep structures.
--force-cleanup=true - Will remove all contents of output folder before generating new content.

Example:
traceability-matrices generate --target-dir=cypress/coverage --output-dir=coverage-static

`);

const lcov = () => console.log(`
traceability-matrices lcov --target-dir= --output-dir= [--relative-dir=] [--force-cleanup=true]

Generates a LCOV file with test coverage and file stricture with features information that can be used as source files which were targets for coverage. This can be used with any coverage reader or analyser tool like SonarQube.

Parameters:
--target-dir - Required, path to directory with coverage reports.
--output-dir - Folder where to store LCOV coverage information and generated "source" files which can be used as a reference coverage reading tools.
--relative-dir - Used to prepend file paths in coverage reports. By default recorded path to genrated sources will be lcov/*.
--force-cleanup=true - Will remove all contents of output folder before generating new content.

Example:
traceability-matrices lcov --target-dir=coverage --output-dir=generated_coverage_lcov --relative-dir=generated_coverage_lcov

`);

const scanFeatures = () => console.log(`
traceability-matrices scan --features-dir= --target-dir=

Searches provided directories for supported feature files and creates report in target dir. Created report is a hidden coverage report with no coverage, this way all found features will be added to report even if they weren't used in tests.

Parameters:
--features-dir - Required, path to a directory with feature files, can be added multiple times if features stored in different folders. Sub-directories will also be scanned recursively.
--target-dir - Required, path to a directory with coverage reports.

Example:
traceability-matrices scan --features-dir=./cypress/features --target-dir=coverage

`);

const serve = () => console.log(`
traceability-matrices serve --target-dir= [--port=] [--key=] [--cert=] [--compact=true]

Run HTTP/S server with coverage reports and open in default browser.

Parameters:
--target-dir - Required, path to directory with coverage reports
--port - Port for HTTP/S server, 8477 by default
--key and --cert - Should point at private key and signed certificate files to start HTTPS server, by default starts HTTP server
--compact - Optional, uses compact variant of HTML table, categories displayed as rows instead of columns. Default value is false. Might be preferable way of rendering features with deep structures.

Example:
traceability-matrices serve --target-dir=cypress/coverage --compact=true

To run HTTPS server provide paths to key and certificate files relative to working directory
traceability-matrices serve --target-dir=coverage --output-dir=statics --compact=true --key=./key.pem --cert=./cert.pem

`);

const stats = () => console.log(`
traceability-matrices stats --target-dir=

Outputs coverage information per feature with requirements.

Parameters:
--target-dir - Required, path to directory with coverage reports.

Example:
traceability-matrices stats --target-dir=cypress/coverage

`);

const threshold = () => console.log(`
traceability-matrices threshold --target-dir= [--total=] [--per-feature=]

Fails(exits with an error code) if coverage thresholds weren't met.

Parameters:
--target-dir - Required, path to directory with coverage reports.
--total - Optional, defines global coverage threshold, value can be between 0 and 100. Fails command if combined coverage of all features does not meet threshold.
--per-feature - Optional, defines coverage threshold applied to each feature, value can be between 0 and 100. Fails command if at least one feature does not meet threshold.

Example:
traceability-matrices threshold --target-dir=cypress/coverage --total=80 --per-feature=60

`);

const generalInfo = () => console.log(`
Supported commands are:
  generate - Generate static HTML files with coverage reports.
  lcov - Generates a LCOV file with test coverage and file stricture with features information that can be used as source files which were targets for coverage.
  scan - Searches provided directories for supported feature files and creates reports in target dir.
  serve - Run HTTP/S server with coverage reports and open in default browser.
  stats - Outputs coverage information per feature with requirements.
  threshold - Fails(exits with an error code) if coverage thresholds weren't met.

Add "--command=" argument to get more info on command arguments, example:
traceability-matrices help --command=serve

`);

const INFO = {
  generate: generateStatic,
  help: () => console.log(`Have fun.`),
  lcov: lcov,
  scan: scanFeatures,
  serve: serve,
  stats: stats,
  threshold: threshold,
} as const;

export const help = (commandName: string) => {
  if (!commandName) {
    generalInfo();
    return;
  }

  if (INFO.hasOwnProperty(commandName)) {
    INFO[commandName]();
  } else {
    console.log(
      `There are no information on "${commandName}" command or it isn't supported.\n`
    );
    generalInfo();
  }
};
