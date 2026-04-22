# @actualwave/traceability-matrices — Claude Context

## What this library does

`@actualwave/traceability-matrices` generates **traceability matrices** for Cypress E2E and integration tests. Engineers annotate test specs with `trace()` calls that record which feature requirements a test covers. After the test run, coverage data is stored as JSON files and can be viewed as HTML reports or LCOV files.

**Core flow:**
1. Define a `feature` in a test file (or load it from a Markdown/YAML/JSON/XML/HTML document)
2. Place `feature.trace()` calls inside `it()` blocks to mark which requirements are covered
3. Run Cypress — coverage JSON files are written automatically via an `after()` hook
4. Use CLI commands to view the reports (`serve`) or generate static files (`generate`)

---

## Installation

```bash
npm install -D @actualwave/traceability-matrices
# or
yarn add -D @actualwave/traceability-matrices
```

**Required Cypress config** — add `TRACE_RECORDS_DATA_DIR` to cypress.config.js:

```js
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    env: {
      TRACE_RECORDS_DATA_DIR: "cypress/coverage", // where coverage JSON files are stored
    },
  },
});
```

**Recommended package.json scripts:**

```json
{
  "scripts": {
    "tm:serve": "traceability-matrices serve --target-dir=cypress/coverage",
    "tm:generate": "traceability-matrices generate --target-dir=cypress/coverage --output-dir=coverage-static"
  }
}
```

---

## Cypress Integration API

Import from `@actualwave/traceability-matrices/cypress`.

### createFeature(params)

Creates a feature and registers it for coverage tracking. Must be called at module scope (outside `describe`/`it`).

```js
import { createFeature } from "@actualwave/traceability-matrices/cypress";

const feature = createFeature({
  title: "My Feature",           // required, must be unique
  description: "HTML string",    // optional, shown above the coverage table
  group: "Feature Group",        // optional, groups features visually in reports
});
```

The returned `feature` object has: `trace()`, `requirement()`, `category()`, `structure()`, `headers()`, `clone()`, `branch()`, `narrow()`, `setTraceToRequirementMatcher()`, `valueOf()`.

---

### feature.trace(requirementPath, chainFn?)

Records that the current test spec covers a requirement. Call inside `it()` blocks.

```js
it("should do X", () => {
  // by requirement name (looks up in structure, matches leaf node)
  feature.trace("requirement #1");

  // by full path array (category → ... → requirement)
  feature.trace(["Category", "Sub Category", "requirement #2"]);

  // with a callback (expectations can be nested inside)
  feature.trace("requirement #3", () => {
    expect(something).toEqual(somethingElse);
  });

  // by function — dynamic lookup (see Matchers section)
  feature.trace(({ branch, structure, categoryPath }) => {
    return "requirement #1";
  });
});
```

> **Important:** Requirement strings must be **unique within their category level**. If a requirement name exists in multiple categories, use a path array or `category()` to disambiguate.

---

### feature.structure(structureObject?, columnHeaders?)

Declares the full requirement tree. Leaf nodes (empty objects, `null`, `''`, any primitive) are requirements; nodes with children are categories.

```js
feature.structure(
  {
    "Root Requirement": {},         // leaf = requirement
    "Category A": {
      "Requirement A1": null,       // null, '', false, 0 all work as leaf values
      "Requirement A2": {},
      "Sub Category": {
        "Requirement A3": {},
      },
    },
  },
  ["Priority", "Category", "Requirement"]  // optional column headers for the HTML table
);
```

> **Without a structure**, coverage is always 100% because there are no untraced requirements to count. Always define a structure when accurate coverage metrics matter.

Returns a structure API object with:

| Method | Description |
|---|---|
| `add(...path)` | Add a category/requirement path if it doesn't exist |
| `get(...path)` | Retrieve a branch object |
| `merge(source)` | Merge another structure object into this feature's structure |
| `clone()` | Return a deep copy of the whole structure |
| `branch(path[])` | Return a deep copy of a sub-branch |
| `narrow(path[])` | Return a copy keeping only the specified path in its original nesting |

---

### feature.requirement(...path)

Pre-specifies a requirement path, returns an object that wraps Cypress lifecycle hooks. Records the requirement when the wrapped block runs.

```js
const req1 = feature.requirement("requirement #1");
// multi-segment path:
const req2 = feature.requirement("Category", "Sub Category", "requirement #2");

req1.it("should do X", () => { /* traces req1 automatically */ });
req1.describe("When X", () => { /* traces req1 for every spec inside */ });
req1.trace();    // immediate trace (no wrapping)
req1.trace(() => { /* with callback */ });

// Aliases available:
req1.context(...)   // same as describe
req1.suite(...)     // same as describe
req1.specify(...)   // same as it
req1.test(...)      // same as it
```

---

### feature.category(...path)

Scopes subsequent `trace()` / `requirement()` calls to a specific category. Supports chaining for sub-categories.

```js
const catA = feature.category("Category A");
const subCat = catA.category("Sub Category");
// shorthand equivalent:
const subCat = feature.category("Category A", "Sub Category");

it("should trace inside category", () => {
  catA.trace("Requirement A1");          // records under ["Category A"]
  subCat.trace("Requirement A3");        // records under ["Category A", "Sub Category"]
});
```

Returns an object with `category()`, `requirement()`, `trace()`, `setTraceToRequirementMatcher()`.

---

### feature.setTraceToRequirementMatcher(matcherFn)

Installs a custom resolver so `trace()` can accept short identifiers instead of full requirement names. The matcher receives `{ name, branch, structure, categoryPath }` and must return a requirement name string or full path array.

```js
import { createFeature, readStructureRequirements } from "@actualwave/traceability-matrices/cypress";

const feature = createFeature({ title: "My Feature", group: "Features" });

feature.structure({
  High: {
    "HR-1 Full requirement text here": null,
    "HR-2 Another long requirement":   null,
  },
  "RR-1 Root requirement": null,
});

// Now traces can use short IDs like "HR-1" instead of full text
feature.setTraceToRequirementMatcher(({ name, structure }) => {
  if (Array.isArray(name)) return name;           // pass through path arrays
  const reqs = readStructureRequirements(structure);
  const found = reqs.find(([key]) => key.startsWith(name));
  return found ? found[1] : name;                 // found[1] is the full path array
});

it("trace by short ID", () => {
  feature.trace("HR-2");   // resolves to ["High", "HR-2 Another long requirement"]
});
```

**Category-scoped matchers:**

```js
const cat = feature.category("High");
cat.setTraceToRequirementMatcher(({ name, branch }) => {
  // branch is the "High" sub-object of the structure
  const reqs = readStructureRequirements(branch);
  const found = reqs.find(([key]) => key.startsWith(name));
  return found ? found[1] : name;
});

// Remove a matcher (falls back to parent category or feature matcher):
cat.setTraceToRequirementMatcher(undefined);
```

> Matchers are stored per-object instance, not per category path. Calling `feature.category("X")` twice returns two independent objects; each needs its own `setTraceToRequirementMatcher()` call.

---

### readStructureRequirements(structure)

Helper that flattens a structure into `[requirementName, fullPathArray][]` pairs. Useful inside matcher functions.

```js
import { readStructureRequirements } from "@actualwave/traceability-matrices/cypress";

const reqs = readStructureRequirements(feature.valueOf().structure);
// => [["Req 1", ["Req 1"]], ["Req 2", ["Cat A", "Req 2"]], ...]
```

---

### feature.clone(params) / feature.branch(params) / feature.narrow(params)

Create derived features that share the same structure (copied, not referenced).

```js
// Clone: full copy of structure
const cloned = feature.clone({ title: "Variant", group: "G" });

// Branch: only the sub-tree at path, re-rooted
const branched = feature.branch({ title: "High Reqs", path: ["High"] });
// branched.structure = { "HR-1 ...": {}, "HR-2 ...": {} }

// Narrow: full depth preserved but only the path branch kept
const narrowed = feature.narrow({ title: "High Scoped", path: ["High"] });
// narrowed.structure = { High: { "HR-1 ...": {}, "HR-2 ...": {} } }
```

All derived features are independent — tracing one does not affect the other.

---

### feature.headers(columnHeaders?)

Get or set column headers for the HTML report table.

```js
feature.headers(["Priority", "PRD", "Requirement"]);
```

---

### feature.valueOf()

Returns the raw internal state object `{ title, group, description, structure, headers, records }`. Useful for debugging or merging state.

---

## Parsers — Loading Features from Files

All parsers are loaded from their own entry points and return the same `FeatureApi` as `createFeature()`.

Each parser comes in two variants:
- **`createFeatureFrom*`** — uses `cy.readFile()`, must be called inside a `before()` hook, returns a Promise
- **`createFeatureFrom*Async`** — can be called at module scope; internally wraps the file read in a `before()` hook and returns a `FeatureApi` immediately (preferred for most use cases)

### Markdown (`/markdown`)

```js
import { createFeatureFromMarkdownAsync } from "@actualwave/traceability-matrices/markdown";

const Feature = createFeatureFromMarkdownAsync("cypress/features/MyFeature.md");
```

**File format:**

```markdown
# Group Name / Feature Title

Optional description paragraph. May contain links and HTML.

## Category Name

- Requirement 1
- Requirement 2

## Another Category

### Sub Category

- Requirement 3
```

Rules:
- `# Title` — 1st-level heading is the feature title. `Group / Title` splits into group and title.
- Text before the first heading/list is the description.
- Lower-level headings and list items become categories/requirements.
- A heading is a **category** if lower-level headings or lists exist beneath it; otherwise it's a **requirement**.
- Lists always produce requirements (or nested categories if they contain sub-lists).

---

### YAML (`/yaml`)

```js
import { createFeatureFromYamlAsync } from "@actualwave/traceability-matrices/yaml";

const Feature = createFeatureFromYamlAsync("cypress/features/MyFeature.yaml");
```

**File format:**

```yaml
title: Feature Title
group: Feature Group
description: "Description with <a href='https://example.com'>HTML</a>"
structure:
  "Root Requirement 1": null
  "Category Name":
    - "Requirement 2"
    - "Requirement 3"
    "Sub Category":
      "Requirement 4": null
```

> Empty objects `{}` in YAML become requirements (leaf nodes), not categories.

---

### JSON (`/json`)

```js
import { createFeatureFromJsonAsync } from "@actualwave/traceability-matrices/json";

const Feature = createFeatureFromJsonAsync("cypress/features/MyFeature.json");
```

**File format:**

```json
{
  "title": "Feature Title",
  "group": "Feature Group",
  "description": "HTML string",
  "structure": {
    "Root Requirement": null,
    "Category": {
      "Requirement 2": {},
      "Sub Category": {
        "Requirement 3": {}
      }
    }
  }
}
```

> Empty `{}` is treated as a leaf requirement, not an empty category.

---

### XML (`/xml`)

```js
import { createFeatureFromXmlAsync } from "@actualwave/traceability-matrices/xml";

const Feature = createFeatureFromXmlAsync("cypress/features/MyFeature.xml");
```

**File format:**

```xml
<feature>
  <title>Feature Title</title>
  <group>Feature Group</group>
  <description>Description with <a href="https://example.com">HTML</a></description>
  <requirement>Root Requirement</requirement>
  <category>
    <n>Category Name</n>
    <requirement>Requirement 2</requirement>
    <category>
      <n>Sub Category</n>
      <requirement>Requirement 3</requirement>
    </category>
  </category>
</feature>
```

> Tag attributes are ignored. `<n>` is the name tag for categories. Empty categories become requirements.

---

### HTML (`/html`)

```js
import { createFeatureFromHtmlAsync } from "@actualwave/traceability-matrices/html";

const Feature = createFeatureFromHtmlAsync("cypress/features/MyFeature.html");
```

**File format — uses `data-` attributes:**

```html
<h1 data-feature-title="Feature Title" data-feature-group="Feature Group"></h1>
<p data-feature-description>Description HTML content of this element is used.</p>

<span data-feature-requirement="Root Requirement"></span>

<ul data-feature-category="Category">
  <li data-feature-requirement="Requirement 2"></li>
  <li data-feature-category="Sub Category">
    <ul>
      <li data-feature-requirement="Requirement 3"></li>
    </ul>
  </li>
</ul>
```

Attributes:
- `data-feature-title` — feature title (value)
- `data-feature-group` — feature group (value, must be on same element as title)
- `data-feature-description` — description; uses element's inner HTML if attribute has no value
- `data-feature-requirement` — requirement name (value)
- `data-feature-category` — category name (value); nesting mirrors DOM nesting

---

### scan command — Registering features without test coverage

To ensure all features appear in reports even if no test covers them yet, pre-register feature files:

```bash
traceability-matrices scan --features-dir=./cypress/features --target-dir=cypress/coverage
```

Supported file extensions for scan: `.md`, `.markdown`, `.json`, `.yaml`, `.yml`, `.xml`, `.html`, `.htm`.

---

## CLI Commands

All commands require `--target-dir` pointing at the directory set in `TRACE_RECORDS_DATA_DIR`. Multiple `--target-dir` flags are supported for combined reports.

### serve

Start a local HTTP(S) server and open the report in the browser.

```bash
traceability-matrices serve \
  --target-dir=cypress/coverage \
  [--port=8477] \
  [--compact=true] \
  [--theme=light|dark|hc-light|hc-dark] \
  [--key=./key.pem --cert=./cert.pem]
```

| Flag | Default | Description |
|---|---|---|
| `--target-dir` | — | **Required.** Coverage reports directory. Repeatable. |
| `--port` | `8477` | HTTP port |
| `--compact` | `false` | Compact table view (categories as rows) — better for deep structures |
| `--theme` | `light` | UI theme: `light`, `dark`, `hc-light`, `hc-dark` |
| `--key` + `--cert` | — | Enable HTTPS (both required together) |

---

### generate

Generate static HTML report files.

```bash
traceability-matrices generate \
  --target-dir=cypress/coverage \
  --output-dir=coverage-static \
  [--compact=true] \
  [--theme=light|dark|hc-light|hc-dark] \
  [--force-cleanup=true]
```

| Flag | Default | Description |
|---|---|---|
| `--target-dir` | — | **Required.** Coverage reports directory. Repeatable. |
| `--output-dir` | — | **Required.** Where to write HTML files. |
| `--compact` | `false` | Compact table layout |
| `--theme` | `light` | UI theme |
| `--force-cleanup` | `false` | Delete output dir contents before generating |

---

### threshold

Exit with error code if coverage doesn't meet thresholds. Useful in CI pipelines.

```bash
traceability-matrices threshold \
  --target-dir=cypress/coverage \
  [--total=80] \
  [--per-feature=60]
```

| Flag | Default | Description |
|---|---|---|
| `--total` | `100` | Minimum combined coverage % across all features |
| `--per-feature` | `100` | Minimum coverage % for each individual feature |

---

### stats

Print per-feature coverage breakdown to stdout.

```bash
traceability-matrices stats --target-dir=cypress/coverage [--feature="Feature Title"]
```

`--feature` can be repeated to filter to specific features.

---

### lcov

Generate LCOV coverage file for use with SonarQube or other tools.

```bash
traceability-matrices lcov \
  --target-dir=cypress/coverage \
  --output-dir=lcov-output \
  [--relative-dir=lcov-output] \
  [--force-cleanup=true]
```

---

### scan

Pre-register feature files so they appear in reports even with 0% coverage.

```bash
traceability-matrices scan \
  --features-dir=./cypress/features \
  --target-dir=cypress/coverage
```

`--features-dir` can be repeated. Scans sub-directories recursively.

---

## Complete Usage Example

**cypress/features/LoginFeature.md:**
```markdown
# Auth / Login

User authentication flows.

## Credentials

- Valid username and password accepted
- Invalid password rejected
- Account lockout after failed attempts

## Session

- Session persists across page reloads
- Logout clears session
```

**cypress/e2e/login.cy.js:**
```js
import { createFeatureFromMarkdownAsync } from "@actualwave/traceability-matrices/markdown";

const LoginFeature = createFeatureFromMarkdownAsync("cypress/features/LoginFeature.md");

describe("Login", () => {
  describe("Credential validation", () => {
    it("accepts valid credentials", () => {
      LoginFeature.trace("Valid username and password accepted");
      cy.login("user", "pass");
      cy.url().should("include", "/dashboard");
    });

    it("rejects invalid password", () => {
      LoginFeature.trace("Invalid password rejected");
      cy.login("user", "wrong");
      cy.get(".error").should("be.visible");
    });
  });

  describe("Session management", () => {
    it("session persists on reload", () => {
      LoginFeature.trace("Session persists across page reloads");
      cy.login("user", "pass");
      cy.reload();
      cy.url().should("include", "/dashboard");
    });
  });
});
```

**Running:**
```bash
# run tests (coverage JSON written to cypress/coverage automatically)
npx cypress run

# view report
npx traceability-matrices serve --target-dir=cypress/coverage

# CI: fail build if below threshold
npx traceability-matrices threshold --target-dir=cypress/coverage --total=80 --per-feature=50
```

---

## Key Concepts to Remember

- **Structure = requirements tree.** Leaf nodes are testable requirements; interior nodes are categories. Without a structure, coverage is always 100%.
- **`trace()` is the only recording mechanism.** Nothing is recorded unless `trace()` (or a `requirement()` wrapper) is called inside a running spec.
- **Requirement lookup order:** If a name matches in the current category scope, that match is used. If not found, it is added as a new root-level requirement. Use path arrays or `category()` to avoid ambiguous matches.
- **`Async` variants of parsers** (`createFeatureFromMarkdownAsync` etc.) are preferred — they can be called at module scope and automatically set up their own `before()` hook internally.
- **The `after()` hook** that writes coverage JSON is installed automatically when the module is imported. It writes to `${TRACE_RECORDS_DATA_DIR}/${specFile}.json`.
- **Multiple `--target-dir`** arguments combine coverage from separate directories into a single report.
- **`scan`** is useful to show 0%-covered features in reports from day one, before any tests are written.
