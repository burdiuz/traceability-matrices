# Parsers — Loading Features from Files

All parsers are imported from their own entry points and return the same `FeatureApi` as `createFeature()`.

Two variants per parser:
- **`createFeatureFrom*`** — uses `cy.readFile()`, must be called inside `before()`, returns a Promise
- **`createFeatureFrom*Async`** — preferred; call at module scope, sets up its own `before()` hook internally

---

## Markdown (`/markdown`)

```js
import { createFeatureFromMarkdownAsync } from "@actualwave/traceability-matrices/markdown";

const Feature = createFeatureFromMarkdownAsync("cypress/features/MyFeature.md");
```

File format:

```markdown
# Group Name / Feature Title

Optional description (text before any heading or list).

## Category Name

- Requirement 1
- Requirement 2

### Sub Category

- Requirement 3
```

Rules:
- `# Title` — feature title; `Group / Title` splits into group and title
- Text before the first heading/list is the description
- A heading is a **category** if lower-level headings or lists follow it; otherwise it's a requirement
- Lists always produce requirements (sub-lists produce nested categories)

---

## YAML (`/yaml`)

```js
import { createFeatureFromYamlAsync } from "@actualwave/traceability-matrices/yaml";

const Feature = createFeatureFromYamlAsync("cypress/features/MyFeature.yaml");
```

```yaml
title: Feature Title
group: Feature Group
description: "Description with <a href='https://example.com'>HTML</a>"
structure:
  "Root Requirement": null
  "Category Name":
    - "Requirement 1"
    - "Requirement 2"
    "Sub Category":
      "Requirement 3": null
```

> Empty objects `{}` in YAML become requirements (leaf nodes), not categories.

---

## JSON (`/json`)

```js
import { createFeatureFromJsonAsync } from "@actualwave/traceability-matrices/json";

const Feature = createFeatureFromJsonAsync("cypress/features/MyFeature.json");
```

```json
{
  "title": "Feature Title",
  "group": "Feature Group",
  "description": "HTML string",
  "structure": {
    "Root Requirement": null,
    "Category": {
      "Requirement 2": {},
      "Sub Category": { "Requirement 3": {} }
    }
  }
}
```

> Empty `{}` is treated as a leaf requirement, not an empty category.

---

## XML (`/xml`)

```js
import { createFeatureFromXmlAsync } from "@actualwave/traceability-matrices/xml";

const Feature = createFeatureFromXmlAsync("cypress/features/MyFeature.xml");
```

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

> `<n>` is the name tag for categories. Tag attributes are ignored. Empty categories become requirements.

---

## HTML (`/html`)

```js
import { createFeatureFromHtmlAsync } from "@actualwave/traceability-matrices/html";

const Feature = createFeatureFromHtmlAsync("cypress/features/MyFeature.html");
```

```html
<h1 data-feature-title="Feature Title" data-feature-group="Feature Group"></h1>
<p data-feature-description>Description HTML content of this element.</p>
<span data-feature-requirement="Root Requirement"></span>
<ul data-feature-category="Category">
  <li data-feature-requirement="Requirement 2"></li>
  <li data-feature-category="Sub Category">
    <ul><li data-feature-requirement="Requirement 3"></li></ul>
  </li>
</ul>
```

Attributes:
- `data-feature-title` — feature title (attribute value)
- `data-feature-group` — feature group (attribute value, must be on same element as title)
- `data-feature-description` — uses element's inner HTML when attribute has no value
- `data-feature-requirement` — requirement name (attribute value)
- `data-feature-category` — category name (attribute value); nesting mirrors DOM nesting
