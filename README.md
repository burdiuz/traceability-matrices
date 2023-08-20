# @actualwave/traceability-matrices

# Work in progress

Integrate requirements into e2e/integration test code and generate traceability matrices for your project. Currently it has an adapter to work with Cypress.
![One file project](./project_a.png)
![Multi-file project](./project_c.png)

## Installation
NPM
`npm install -D @actualwave/traceability-matrices`
Yarn
`yarn add -D @actualwave/traceability-matrices`

## Usage
Add a script to your package.json
`traceability-matrices serve --target-dir=<folder with coverage reports>`

## Cypress integration
Add `TRACE_RECORDS_DATA_DIR` environment variable to cypress config that will tell where to store coverage reports
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


This project has a part that integrates into Cypress test files and adds traces of covered requirements. To start import it
```js
import { createProject } from "@actualwave/traceability-matrices/cypress";
```
Then use imported function to create a project
```js
const Project = createProject("My Project");
```
And create traces for requirements within the test specs
```js
it("should display entry point path", () => {
  Project.trace("Path to App.js should be visible");
  cy.get(".App-header p > code").should("contain", "src/App.js");
});
```
When test run is finished, coverage report for it will be stored in specified folder. Coverage is generated into a JSON file, to have a human-readable format, run `serve` command.


Using only traces will generate flat requirements structure, if you want to add categories, priorities or groups to it, sefine a structure to the project.
```js
import { createProject } from "@actualwave/traceability-matrices/cypress";

const Project = createProject("My Project");

Project.structure({
  Statics: {
    "Add header text": {},
    "Path to App.js should be visible": {},
    "Add welcome text": {},
  }
});
```
When using a trace, it will be matched to a leaf node of the structure with same name.
