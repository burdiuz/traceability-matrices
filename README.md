# @actualwave/traceability-matrices

Integrate requirements into e2e/integration test code and generate traceability matrices for your project. Currently this project has an adapter to work with [Cypress](https://www.cypress.io/) tests.

![One file project](https://github.com/burdiuz/traceability-matrices/blob/master/screenshots/project_a.png?raw=true)

![Multi-file project](https://github.com/burdiuz/traceability-matrices/blob/master/screenshots/project_c.png?raw=true)

## How it works

Work with this project starts with placing traces of requirements within a test file.

```js
it("should do something according to requirement #1", () => {
  project.trace("requirement #1");

  expect(something).toEqual(somethingElse);
});
```

Once test run is finished, coverage report will be stored in a coverage folder specified in cypress config or environment variable. Stored file is a JSON file and is not suitable for viewing, to generate viewable information and actual matrices/tables, user should use command `traceability-matrices generate` to generate static HTML files with reports or `traceability-matrices serve` to start local HTTP server with reports.

Example project is available in [git repo](https://github.com/burdiuz/traceability-matrices/tree/master/test-project)

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
      // will store coverage reports in <project-root>/cypress/coverage
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
- `--https` - set to "true"(`--https=true`) to start HTTPS server, by default starts HTTP server
- `--compact` - optional, uses compact variant of HTML table, categories displayed as rows instead of columns. Default value is false. Might be preferable way of rendering projects with deep structures.

Example:

```
traceability-matrices serve --target-dir=cypress/coverage --https=true --compact=true
```

### traceability-matrices generate

Generate static HTML files with coverage reports.  
Parameters:

- `--target-dir` - required, path to directory with coverage reports.
- `--output-dir` - required, path to folder where generated HTML files should be stored
- `--compact` - optional, uses compact variant of HTML table, categories displayed as rows instead of columns. Default value is false. Might be preferable way of rendering projects with deep structures.

Example:

```
traceability-matrices generate --target-dir=cypress/coverage --output-dir=coverage-static
```

### traceability-matrices threshold

Fails(exits with an error code) if coverage thresholds weren't met.  
Parameters:

- `--target-dir` - required, path to directory with coverage reports.
- `--total` - optional, defines global coverage threshold, value can be between 0 and 100. Fails command if combined coverage of all project does not meet threshold.
- `--per-project` - optional, defines coverage threshold applies to every project, value can be between 0 and 100. Fails command if at least one project does not meet threshold.

Example:

```
traceability-matrices threshold --target-dir=cypress/coverage --total=80 --per-project=60
```

### traceability-matrices stats

Outputs coverage information per project with requirements.

Example:

```
traceability-matrices stats --target-dir=cypress/coverage
```

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

and defining a project in a test file

```js
import { createProject } from "@actualwave/traceability-matrices/cypress";

const project = createProject("My Project");
```

`createProject(projectTitle: string, projectDescription?: string)` accepts project title and optionally description. Project titles must be unique strings. Project description could be an HTML string, it will display on top of project coverage table and is suitable for placing various project links and other useful information.

```ts
import { createProject } from "@actualwave/traceability-matrices/cypress";

const project = createProject(
  "My Project",
  `
<h1>Useful information</1>
<a href="https://react.dev/">Learn React</a>`
);
```

Created `project` provides methods to match test specs with project requriements and genrates test records that will be stored in a JSON file once test run is finished.

### project.trace()

To match requirements with specs, traces should be placed within specs, like

```js
// test spec
it("should do something according to requirement #1", () => {
  // trace requirement
  project.trace("requirement #1");

  expect(something).toEqual(somethingElse);
});
```

> Note: To properly match requirement string with project structure requirement must be a unique string within its project.

After running this test, coverage will contain a record that spec `should do something according to requirement #1` tests `requirement #1` requirement. One spec may contain multiple requriements and traces could contain expectations or be nested.

```js
it("should do something according to multiple requirements", () => {
  project.trace("requirement #1", () => {
    expect(something).toEqual(somethingElse);

    project.trace("requirement #3", () => {
      expect(something).toEqual(somethingElse);

      project.trace("requirement #4", () => {
        expect(something).toEqual(somethingElse);
      });
    });
  });

  project.trace("requirement #2");
  expect(something).toEqual(somethingElse);
});
```

`project.trace()` could be used to generate requirements tree by providing an array of strings

```js
it("should do something according to requirement #1", () => {
  project.trace(["High", "General", "PRD I", "requirement #1"]);
  project.trace(["High", "General", "PRD I", "requirement #2"]);
  project.trace(["High", "General", "PRD I", "requirement #3"]);
  project.trace(["Low", "PRD IVa", "requirement #45"]);
  project.trace(["Low", "PRD IVa", "requirement #46"]);
  project.trace(["optional requirement #1"]);

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

Such structure also could be created using `project.structure()` method

```js
project.structure({
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

and with this just use requirement name in `project.trace()` call,

```js
it("should do something according to requirement #1", () => {
  project.trace("requirement #3");
  expect(something).toEqual(somethingElse);
});
```

it will be matched to leaf node of structure. If requirement not found in structure, it will be added to the root of structure when coverage is generated.

Without structure containing all project requirements it will have 100% coverage because there will be only requirements added from traces placed in specs(which are already marked as covered). Having structure with all project requirements allows proper coverage calculation. For coverage calculation it does not matter(purely visual benefit) if structure is flat or organised into categories.

> Note: Categories(branches, not leaf nodes) in such structure could contain HTML markup. Using HTML markup in requirement string is also possible, it will be properly rendered but might be uncomfortable to use in test specs.

### project.requirement()

With `project.trace()`, engineer could use `project.requirement()` and specify requirement to use in multiple places.

```js
const req1 = project.requirement("requirement #1");
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

### project.structure()

`project.structure()` used to specify category tree, and it should be built only with objects. Leaf objects of this structure will be identified as a testable requirements, other branches are categories and could not be tested.

```js
project.structure({
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
project.structure(
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

`project.structure()` return an object with additional methods to work with structure.

- `add(...path: string[]) => Record<string, object>` - add categories/requirements to the structure if not exist
- `get(...path: string[]) => Record<string, object>` - retrieve a branch of the structure
- `merge(source: Record<string, object>) => void` - merge external structure into
- `clone(...path: string[]) => Record<string, object>` - clone and return whole or branch of the structure
- `branch(path: string[], projectTitle: string, projectDescription?: string) => ProjectApi` - create a sub-project from structure branch. sub-project will have no connection to current project and structures will be copied.
- `narrow(path: string[], projectTitle: string, projectDescription?: string) => ProjectApi` - create sub-project with a structure by removing branches out of provided path. sub-project will have no connection to current project and structures will be copied.

### project.headers()

Allows to specify list of HTML table headers. In compact mode only last header is used.

### project.clone()

Clone project, creates a new project with same structure and empty test records.

### project.valueOf()

Returns internal state of the project
