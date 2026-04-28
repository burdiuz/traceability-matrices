---
name: traceability-matrices
description: >
  Generates traceability matrices for Cypress E2E and integration tests.
  Annotate test specs with trace() calls to link them to feature requirements,
  then view coverage as interactive HTML reports or LCOV files.
  Use when setting up requirement coverage tracking in a Cypress project,
  integrating traceability matrices into CI pipelines, or generating static
  coverage reports from existing Cypress test suites.
license: MIT
compatibility: Requires a Cypress project with Node.js >= 14. CLI commands require the package installed as a dev dependency.
metadata:
  author: Oleg Galaburda
  npm: "@actualwave/traceability-matrices"
---

# @actualwave/traceability-matrices

Generates traceability matrices for Cypress E2E tests. Tests are annotated with `trace()` calls that map specs to feature requirements. After a Cypress run, coverage JSON files are written automatically, and the CLI serves or generates HTML reports.

## Installation & setup

```bash
npm install -D @actualwave/traceability-matrices
```

Add `TRACE_RECORDS_DATA_DIR` to `cypress.config.js`:

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

Recommended `package.json` scripts:

```json
{
  "scripts": {
    "tm:serve":    "traceability-matrices serve --target-dir=cypress/coverage",
    "tm:generate": "traceability-matrices generate --target-dir=cypress/coverage --output-dir=coverage-static"
  }
}
```

## Core flow

1. Define a feature in a spec file (or load one from Markdown/YAML/JSON/XML/HTML)
2. Call `feature.structure()` to declare the requirement tree
3. Call `feature.trace()` inside `it()` blocks to mark covered requirements
4. Run Cypress — coverage JSON files are written automatically
5. Use the CLI to view (`serve`) or export (`generate`) the report

## Quick start

```js
import { createFeature } from "@actualwave/traceability-matrices/cypress";

const Feature = createFeature({
  title: "Login",       // required, must be unique across all features
  group: "Auth",        // optional, groups features in reports
  description: "Login flows",  // optional HTML, shown above the table
});

Feature.structure(
  {
    Credentials: {
      "Valid credentials accepted": null,
      "Invalid password rejected":  null,
    },
    Session: {
      "Session persists on reload": null,
      "Logout clears session":      null,
    },
  },
  ["Category", "Requirement"]
);

describe("Login", () => {
  it("accepts valid credentials", () => {
    Feature.trace("Valid credentials accepted");
    cy.login("user", "pass");
    cy.url().should("include", "/dashboard");
  });

  it("rejects bad password", () => {
    Feature.trace("Invalid password rejected");
    cy.login("user", "wrong");
    cy.get(".error").should("be.visible");
  });
});
```

## Loading features from files

Use parser variants when requirements are maintained in separate files.  
`Async` variants are preferred — they work at module scope and manage their own `before()` hook.

```js
import { createFeatureFromMarkdownAsync } from "@actualwave/traceability-matrices/markdown";
import { createFeatureFromYamlAsync }     from "@actualwave/traceability-matrices/yaml";
import { createFeatureFromJsonAsync }     from "@actualwave/traceability-matrices/json";
import { createFeatureFromXmlAsync }      from "@actualwave/traceability-matrices/xml";
import { createFeatureFromHtmlAsync }     from "@actualwave/traceability-matrices/html";

const Feature = createFeatureFromMarkdownAsync("cypress/features/Login.md");
```

See [references/parsers.md](references/parsers.md) for file format details.

## Scoping traces to a category

Use `feature.category()` when requirement names repeat across categories:

```js
const High = Feature.category("High");
const Sub  = Feature.category("Medium", "Sub-category");

it("scoped traces", () => {
  High.trace("Requirement 1");  // records under ["High"]
  Sub.trace("Requirement 1");   // records under ["Medium", "Sub-category"]
});
```

## Tracing with requirement wrappers

`feature.requirement()` pre-specifies a path and wraps Cypress lifecycle hooks:

```js
Feature.requirement("Hooks", "it()").it("works like it()", () => {
  cy.window(() => {});
});

const req = Feature.requirement("Should allow trace as usual");
it("plain trace", () => { req.trace(); });
```

## CLI commands

All commands require `--target-dir` pointing at `TRACE_RECORDS_DATA_DIR`.

| Command     | Purpose                                              |
|-------------|------------------------------------------------------|
| `serve`     | Start a local server and open the report in browser  |
| `generate`  | Write static HTML report files                       |
| `threshold` | Exit non-zero if coverage is below a threshold (CI)  |
| `stats`     | Print per-feature coverage breakdown to stdout       |
| `lcov`      | Generate LCOV file for SonarQube / similar           |
| `scan`      | Pre-register feature files for 0%-coverage baseline  |

```bash
# view report locally
traceability-matrices serve --target-dir=cypress/coverage

# CI gate — fail if total < 80% or any feature < 50%
traceability-matrices threshold --target-dir=cypress/coverage --total=80 --per-feature=50

# pre-register features before any test runs
traceability-matrices scan --features-dir=./cypress/features --target-dir=cypress/coverage
```

See [references/cli.md](references/cli.md) for all flags.

## Key concepts

- **Structure = requirements tree.** Leaf nodes (`null`, `{}`, `''`) are requirements; interior nodes are categories. Without a structure, coverage is always 100%.
- **`trace()` is the only recording mechanism.** Nothing is recorded unless `trace()` (or a `requirement()` wrapper) runs inside an active spec.
- **Requirement name uniqueness.** If the same name appears in multiple categories, use a path array `["Category", "Requirement"]` or `category()` to disambiguate.
- **`after()` hook is automatic.** The hook that writes coverage JSON is installed on import — do not add it manually.
- **`scan`** ensures features appear in reports from day one, before any test covers them.

See [references/api.md](references/api.md) for the full API reference.
