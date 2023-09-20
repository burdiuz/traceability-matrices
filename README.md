# @actualwave/traceability-matrices

Integrate requirements into e2e/integration test code and generate traceability matrices for your feature. Currently this feature has an adapter to work with [Cypress](https://www.cypress.io/) tests.

![List of spec files](https://github.com/burdiuz/traceability-matrices/blob/master/screenshots/files.png?raw=true)

![List of features](https://github.com/burdiuz/traceability-matrices/blob/master/screenshots/features.png?raw=true)

![One file feature](https://github.com/burdiuz/traceability-matrices/blob/master/screenshots/feature_a.png?raw=true)

![Multi-file feature](https://github.com/burdiuz/traceability-matrices/blob/master/screenshots/feature_c.png?raw=true)

## How it works

Work with this feature starts with placing traces of requirements within a test file.

```js
it("should do something according to requirement #1", () => {
  feature.trace("requirement #1");

  expect(something).toEqual(somethingElse);
});
```

Once test run is finished, coverage report will be stored in a coverage folder specified in cypress config or environment variable. Stored file is a JSON file and is not suitable for viewing, to generate viewable information and actual matrices/tables, user should use command `traceability-matrices generate` to generate static HTML files with reports or `traceability-matrices serve` to start local HTTP server with reports.

Example feature is available in [git repo](https://github.com/burdiuz/traceability-matrices/tree/master/test-feature)

## Installation

Install the package via NPM

```
npm install -D @actualwave/traceability-matrices
```

or Yarn

```
yarn add -D @actualwave/traceability-matrices
```

Then configure by defining an environment variable `TRACE_RECORDS_DATA_DIR`, this could be done in cypress config file

```js
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    env: {
      // will store coverage reports in <feature-root>/cypress/coverage
      TRACE_RECORDS_DATA_DIR: "cypress/coverage",
    },
  },
});
```

Also, it might be useful to add commands to package.json

```json
  "scripts": {
    "tm:serve": "traceability-matrices serve --target-dir=cypress/coverage",
    "tm:generate": "traceability-matrices generate --target-dir=cypress/coverage --output-dir=coverage-static"
  },
```

calling `npm run tm:serve` will start local HTTP server with coveragereports and `npm run tm:generate` will generate HTML reports into `xcoverage-static` folder.

## Commands

This package supports multiple commands to work with generated coverage reports after test run. All commands accept required parameter `--target-dir` which points at a coverage reports root folder, it is the same folder defined in `TRACE_RECORDS_DATA_DIR` environment variable. This parameter could be provided multiple times to point at multiple coverage directories to generate combined report.

### traceability-matrices serve

Run HTTP/S server with coverage reports and open in default browser.  
Parameters:

- `--target-dir` - required, path to directory with coverage reports
- `--port` - port for HTTP/S server, 8477 by default
- `--key` and `--cert` - should point at private key and signed certificate files to start HTTPS server, by default starts HTTP server
- `--compact` - optional, uses compact variant of HTML table, categories displayed as rows instead of columns. Default value is false. Might be preferable way of rendering features with deep structures.

Example:

```
traceability-matrices serve --target-dir=cypress/coverage --https=true --compact=true
```
![Feature compact view](https://github.com/burdiuz/traceability-matrices/blob/master/screenshots/compact_view.png?raw=true)

To run HTTPS server provide paths to key and certificate files relative to working directory
```
traceability-matrices serve --target-dir=coverage --output-dir=statics --compact=true --key=./key.pem --cert=./cert.pem
```

### traceability-matrices generate

Generate static HTML files with coverage reports.  
Parameters:

- `--target-dir` - required, path to directory with coverage reports.
- `--output-dir` - required, path to folder where generated HTML files should be stored
- `--compact` - optional, uses compact variant of HTML table, categories displayed as rows instead of columns. Default value is false. Might be preferable way of rendering features with deep structures.

Example:

```
traceability-matrices generate --target-dir=cypress/coverage --output-dir=coverage-static
```

### traceability-matrices threshold

Fails(exits with an error code) if coverage thresholds weren't met.  
Parameters:

- `--target-dir` - required, path to directory with coverage reports.
- `--total` - optional, defines global coverage threshold, value can be between 0 and 100. Fails command if combined coverage of all feature does not meet threshold.
- `--per-feature` - optional, defines coverage threshold applies to every feature, value can be between 0 and 100. Fails command if at least one feature does not meet threshold.

Example:

```
traceability-matrices threshold --target-dir=cypress/coverage --total=80 --per-feature=60
```
![Threshold command output](https://github.com/burdiuz/traceability-matrices/blob/master/screenshots/threshold.png?raw=true)

### traceability-matrices stats

Outputs coverage information per feature with requirements.

Example:

```
traceability-matrices stats --target-dir=cypress/coverage
```
![Stats command output](https://github.com/burdiuz/traceability-matrices/blob/master/screenshots/stats.png?raw=true)

## Cypress integration

Cypresss integration starts with adding `TRACE_RECORDS_DATA_DIR` environment variable to cypress config that will tell where to store coverage reports

```js
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    env: {
      TRACE_RECORDS_DATA_DIR: "cypress/coverage",
    },
  },
});
```

and defining a feature in a test file

```js
import { createFeature } from "@actualwave/traceability-matrices/cypress";

const feature = createFeature("My Feature");
```

`createFeature(featureTitle: string, featureDescription?: string)` accepts feature title and optionally description. Feature titles must be unique strings. Feature description could be an HTML string, it will display on top of feature coverage table and is suitable for placing various feature links and other useful information.

```ts
import { createFeature } from "@actualwave/traceability-matrices/cypress";

const feature = createFeature(
  "My Feature",
  `
<h1>Useful information</1>
<a href="https://react.dev/">Learn React</a>`
);
```

Created `feature` provides methods to match test specs with feature requriements and genrates test records that will be stored in a JSON file once test run is finished.

### feature.trace()

To match requirements with specs, traces should be placed within specs, like

```js
// test spec
it("should do something according to requirement #1", () => {
  // trace requirement
  feature.trace("requirement #1");

  expect(something).toEqual(somethingElse);
});
```

> Note: To properly match requirement string with feature structure requirement must be a unique string within its feature.

After running this test, coverage will contain a record that spec `should do something according to requirement #1` tests `requirement #1` requirement. One spec may contain multiple requriements and traces could contain expectations or be nested.

```js
it("should do something according to multiple requirements", () => {
  feature.trace("requirement #1", () => {
    expect(something).toEqual(somethingElse);

    feature.trace("requirement #3", () => {
      expect(something).toEqual(somethingElse);

      feature.trace("requirement #4", () => {
        expect(something).toEqual(somethingElse);
      });
    });
  });

  feature.trace("requirement #2");
  expect(something).toEqual(somethingElse);
});
```

`feature.trace()` could be used to generate requirements tree by providing an array of strings

```js
it("should do something according to requirement #1", () => {
  feature.trace(["High", "General", "PRD I", "requirement #1"]);
  feature.trace(["High", "General", "PRD I", "requirement #2"]);
  feature.trace(["High", "General", "PRD I", "requirement #3"]);
  feature.trace(["Low", "PRD IVa", "requirement #45"]);
  feature.trace(["Low", "PRD IVa", "requirement #46"]);
  feature.trace(["optional requirement #1"]);

  expect(something).toEqual(somethingElse);
});
```

This will generate a structure of requirements

- High
  - General
    - PRD I
      - requirement #1
      - requirement #2
      - requirement #3
- Low
  - PRD IVa
    - requirement #45
    - requirement #46
- optional requirement #1

Such structure also could be created using `feature.structure()` method

```js
feature.structure({
  High: {
    General: {
      "PRD I": {
        "requirement #1": {},
        "requirement #2": {},
        "requirement #3": {},
      },
    },
  },
  Low: {
    "PRD IVa": {
      "requirement #45": {},
      "requirement #46": {},
    },
  },
  "optional requirement #1": {},
});
```

and with this just use requirement name in `feature.trace()` call,

```js
it("should do something according to requirement #1", () => {
  feature.trace("requirement #3");
  expect(something).toEqual(somethingElse);
});
```

it will be matched to leaf node of structure. If requirement not found in structure, it will be added to the root of structure when coverage is generated.

Without structure containing all feature requirements it will have 100% coverage because there will be only requirements added from traces placed in specs(which are already marked as covered). Having structure with all feature requirements allows proper coverage calculation. For coverage calculation it does not matter(purely visual benefit) if structure is flat or organised into categories.

> Note: Categories(branches, not leaf nodes) in such structure could contain HTML markup. Using HTML markup in requirement string is also possible, it will be properly rendered but might be uncomfortable to use in test specs.

### feature.requirement()

With `feature.trace()`, engineer could use `feature.requirement()` and specify requirement to use in multiple places.

```js
const req1 = feature.requirement("requirement #1");
```

Once created, it could be used to replace test lifecycle hooks like `describe()` and `it()`

```js
req1.describe('When someting', () => {
  ...
});

req1.it('should do', () => {
  ...
});
```

Both will record requirement being tested in these places.

### feature.structure()

`feature.structure()` used to specify category tree, and it should be built only with objects. Leaf objects of this structure will be identified as a testable requirements, other branches are categories and could not be tested.

```js
feature.structure({
  High: {
    General: {
      "PRD I": {
        "requirement #1": {},
        "requirement #2": {},
        "requirement #3": {},
      },
    },
  },
});
```

With structure tree optionally list of table headers could be provided, they will be used to render HTML table in the report

```js
feature.structure(
  {
    High: {
      General: {
        "PRD I": {
          "requirement #1": {},
          "requirement #2": {},
          "requirement #3": {},
        },
      },
    },
  },
  ["Priority", "Category", "Requirement"]
);
```

If test will contain a trace to category, that record will be added as a leaf node to the root of the structure.

`feature.structure()` return an object with additional methods to work with structure.

- `add(...path: string[]) => Record<string, object>` - add categories/requirements to the structure if not exist
- `get(...path: string[]) => Record<string, object>` - retrieve a branch of the structure
- `merge(source: Record<string, object>) => void` - merge external structure into
- `clone(...path: string[]) => Record<string, object>` - clone and return whole or branch of the structure
- `branch(path: string[], featureTitle: string, featureDescription?: string) => FeatureApi` - create a sub-feature from structure branch. sub-feature will have no connection to current feature and structures will be copied.
- `narrow(path: string[], featureTitle: string, featureDescription?: string) => FeatureApi` - create sub-feature with a structure by removing branches out of provided path. sub-feature will have no connection to current feature and structures will be copied.

### feature.headers()

Allows to specify list of HTML table headers. In compact mode only last header is used.

### feature.clone()

Clone feature, creates a new feature with same structure and empty test records.

### feature.valueOf()

Returns internal state of the feature

## Links
For latest version of reporting UI I've used couple free [FontAwesome icons](https://fontawesome.com/).