# API Reference

## createFeature(params)

Must be called at module scope (outside `describe`/`it`). `title` must be unique across all features.

```js
import { createFeature } from "@actualwave/traceability-matrices/cypress";

const Feature = createFeature({
  title: "My Feature",        // required, unique
  description: "HTML string", // optional, shown above the coverage table
  group: "Feature Group",     // optional, groups features in reports
});
```

---

## feature.structure(structureObject?, columnHeaders?)

Declares the requirement tree. Leaf nodes (`null`, `{}`, `''`, any primitive) are requirements; interior nodes with children are categories.

```js
Feature.structure(
  {
    High: {
      "High Requirement 1": null,
      "High Requirement 2": null,
    },
    Medium: {
      "Medium Requirement 1": null,
      "Sub-category": {
        "Sub Requirement 1": null,
      },
    },
    "Optional Requirement 1": null,
  },
  ["Main categories", "Sub categories", "Requirements"]
);

// merge in additional requirements after the fact
Feature.structure().merge({
  Low: { "Low Requirement 1": null, "Low Requirement 2": null },
});

// add a single path
Feature.structure().add("Low", "Low Requirement 3");
```

Structure API methods:

| Method | Description |
|---|---|
| `add(...path)` | Add a path if it doesn't exist |
| `get(...path)` | Retrieve a branch |
| `merge(source)` | Merge another structure object in |
| `clone()` | Deep copy of the full structure |
| `branch(path[])` | Deep copy of a sub-branch |
| `narrow(path[])` | Copy keeping only the specified path in its original nesting |

---

## feature.trace(requirementPath, chainFn?)

Records that the current spec covers a requirement. Call inside `it()` blocks only.

```js
it("should do X", () => {
  // by unique requirement name
  Feature.trace("High Requirement 2");

  // by full path (use when names are ambiguous across categories)
  Feature.trace(["Low", "Requirement 1"]);
  Feature.trace(["Medium", "Sub-category", "Sub Requirement 1"]);

  // with a callback — nested traces and Cypress commands work inside
  Feature.trace("Optional Requirement 1", () => {
    Feature.trace("Optional Requirement 2", () => {
      cy.window().then(() => {});
    });
  });

  // by function — dynamic lookup
  Feature.trace(() => "Medium Requirement 1");
});
```

---

## feature.category(...path)

Scopes traces to a specific category. Useful when requirement names repeat across categories.

```js
const High   = Feature.category("High");
const Medium = Feature.category("Medium");
const Sub    = Feature.category("Medium", "Sub-category");

it("scoped traces", () => {
  High.trace("Requirement 1");          // records under ["High"]
  Medium.trace("Requirement 1");        // records under ["Medium"]
  Sub.trace("Requirement 1");           // records under ["Medium", "Sub-category"]

  // chained sub-category access
  Medium.category("Sub-category").trace("Requirement 2");
});
```

Returns an object with `category()`, `requirement()`, `trace()`, `setTraceToRequirementMatcher()`.

---

## feature.requirement(...path)

Pre-specifies a requirement path and returns an object that wraps Cypress lifecycle hooks. The requirement is recorded automatically when the wrapped block runs.

```js
Feature.requirement("Hooks", "describe()").describe("requirement().describe()", () => {
  it("works as describe()", () => { cy.window(() => {}); });
});

Feature.requirement("Hooks", "it()").it("works as it()", () => {
  cy.window(() => {});
});

const req = Feature.requirement("Should allow trace as usual");
it("plain trace", () => { req.trace(); });
it("trace with callback", () => { req.trace(() => { cy.window(() => {}); }); });
```

Aliases: `.context()` = `.describe()`, `.suite()` = `.describe()`, `.specify()` = `.it()`, `.test()` = `.it()`.

---

## feature.setTraceToRequirementMatcher(matcherFn)

Installs a custom resolver so `trace()` accepts short IDs or fuzzy names. The matcher receives `{ name, branch, structure, categoryPath }` and returns a requirement name or full path array. Pass `undefined` to remove.

```js
import { createFeature, readStructureRequirements } from "@actualwave/traceability-matrices/cypress";

Feature.structure({
  High: {
    "HR-1 Full requirement text here": null,
    "HR-2 Another long requirement":   null,
  },
});

Feature.setTraceToRequirementMatcher(({ name, structure }) => {
  if (Array.isArray(name)) return name;
  const reqs = readStructureRequirements(structure);
  const found = reqs.find(([key]) => key.startsWith(name));
  return found ? found[1] : name;
});

it("trace by short ID", () => {
  Feature.trace("HR-2");  // resolves to ["High", "HR-2 Another long requirement"]
});
```

Category-scoped matchers receive `branch` as the category's sub-object:

```js
const cat = Feature.category("High");
cat.setTraceToRequirementMatcher(({ name, branch }) => {
  const reqs = readStructureRequirements(branch);
  const found = reqs.find(([key]) => key.startsWith(name));
  return found ? found[1] : name;
});
```

> Matchers are per-object instance. Calling `feature.category("X")` twice returns two independent objects, each needing their own matcher.

---

## readStructureRequirements(structure)

Flattens a structure into `[requirementName, fullPathArray][]` pairs. Useful inside matcher functions.

```js
import { readStructureRequirements } from "@actualwave/traceability-matrices/cypress";

const reqs = readStructureRequirements(Feature.valueOf().structure);
// => [["High Requirement 1", ["High", "High Requirement 1"]], ...]
```

---

## feature.clone() / feature.branch() / feature.narrow()

Derive a new independent feature from an existing one (copied structure, no shared state).

```js
// clone: full copy of structure, new title/group
const Cloned = Feature.clone({ title: "Cloned Feature", group: "Features" });

// branch: only the sub-tree at path, re-rooted (path segments stripped)
const Branch = Feature.branch({ title: "Medium Branch", group: "Features", path: ["Medium"] });
// Branch.structure = { "Requirement 1": {}, "Sub-category": { ... } }

// narrow: full depth preserved, only the specified path branch kept
const Narrow = Feature.narrow({ title: "Medium Narrowed", group: "Features", path: ["Medium"] });
// Narrow.structure = { Medium: { "Requirement 1": {}, "Sub-category": { ... } } }
```

```js
describe("Narrowed", () => {
  it("trace", () => {
    Narrow.trace("Medium Requirement 1");
    Narrow.trace(["Medium", "Sub-category", "Sub Requirement 1"]);
  });
});

describe("Branch", () => {
  it("trace", () => {
    Branch.trace(["Sub-category", "Sub Requirement 1"]); // no "Medium" prefix
  });
});
```

---

## feature.headers(columnHeaders?)

Get or set column headers for the HTML report table.

```js
Feature.headers(["Priority", "Category", "Requirement"]);
Feature.headers().set(0, "Main categories");
```

---

## feature.valueOf()

Returns the raw internal state `{ title, group, description, structure, headers, records }`.

---

## Multiple features across spec files

The same feature title can be imported across multiple spec files — coverage is merged automatically.

```js
// file-1.cy.js
const FeatureA = createFeature({ title: "Feature A", group: "Features" });
FeatureA.structure({ High: { "Requirement 1": null, "Requirement 2": null } });

const FeatureB = createFeature({ title: "Feature B", group: "Features" });
FeatureB.structure({ Low: { "Requirement 1": null, "Requirement 2": null } });

it("traces A and B together", () => {
  FeatureA.trace(["High", "Requirement 1"]);
  FeatureA.trace(["High", "Requirement 2"], () => {
    FeatureB.trace(["Low", "Requirement 1"]);
  });
});

// file-2.cy.js — same Feature A, different spec file, coverage is merged
const FeatureA = createFeature({ title: "Feature A", group: "Features" });
it("more A coverage", () => {
  FeatureA.trace(["High", "Requirement 2"]);
});
```
