# @actualwave/traceability-matrices

Integrate requirements into e2e/integration test code and generate [traceability matrices](https://en.wikipedia.org/wiki/Traceability_matrix) for your project. Currently this library has an adapter to work with [Cypress](https://www.cypress.io/) tests.

![List of spec files](https://github.com/burdiuz/traceability-matrices/blob/master/screenshots/files.png?raw=true)

![List of features](https://github.com/burdiuz/traceability-matrices/blob/master/screenshots/features.png?raw=true)

![Default feature view](https://github.com/burdiuz/traceability-matrices/blob/master/screenshots/default_view.png?raw=true)

Examples of generated coverage reports can be viewed here for [default coverage template](https://burdiuz.github.io/traceability-matrices/generated_coverage_default/features.html) and [compact coverage template](https://burdiuz.github.io/traceability-matrices/generated_coverage_compact/features.html).

## How it works

When creating E2E or integration tests engineers place special tracking commands using `trace()` function, it records which requirements of tested feature were covered and stores this information in JSON files as coverage. After tests run this coverage information can be viewed or used to generate HTML or LCOV coverage reports.

This is how trace usually look like, it accepts a name of the requirement or an array of strings which contains full category path to the requirement.

```js
it("should do something according to requirement #1", () => {
  // by requirement name
  feature.trace("requirement #1");

  // by full category path
  feature.trace(["category", "sub category", "requirement #2"]);

  expect(something).toEqual(somethingElse);
});
```

The `feature` object used in the example above represents a specific feature that contains structure of its requirements. Feature object can be created in the test file, imported into test file or created by parsing a document of Markdown, YAML, XML, HTML or JSON format.

The file generated after test run is a JSON file and is not suitable for viewing, to generate viewable information and actual matrices/tables, user should use command `traceability-matrices generate` to generate static HTML files with reports or `traceability-matrices serve` to start local HTTP server with reports.

Example project is available in [git repo](https://github.com/burdiuz/traceability-matrices/tree/master/tests/cypress/setup)

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

calling `npm run tm:serve` will start local HTTP server with coveragereports and `npm run tm:generate` will generate HTML reports into `coverage-static` folder.

## Commands

This package supports multiple commands to work with generated coverage reports after test run. All commands accept required parameter `--target-dir` which points at a coverage reports root folder, it is the same folder defined in `TRACE_RECORDS_DATA_DIR` environment variable. This parameter could be provided multiple times to point at multiple coverage directories to generate combined report.

### traceability-matrices serve

Run HTTP/S server with coverage reports and open in default browser.  
Parameters:

- `--target-dir` - Required, path to directory with coverage reports
- `--port` - Port for HTTP/S server, 8477 by default
- `--key` and `--cert` - Should point at private key and signed certificate files to start HTTPS server, by default starts HTTP server
- `--compact` - Optional, uses [compact variant of HTML table](https://burdiuz.github.io/traceability-matrices/generated_coverage_compact/features/Records-_-Category.html), categories displayed as rows instead of columns. Default value is false. Might be preferable way of rendering features with deep structures.

Example:

```
traceability-matrices serve --target-dir=cypress/coverage --compact=true
```

![Feature compact view](https://github.com/burdiuz/traceability-matrices/blob/master/screenshots/compact_view.png?raw=true)

To run HTTPS server provide paths to key and certificate files relative to working directory

```
traceability-matrices serve --target-dir=coverage --output-dir=statics --compact=true --key=./key.pem --cert=./cert.pem
```

### traceability-matrices generate

Generate static HTML files with coverage reports.  
Parameters:

- `--target-dir` - Required, path to directory with coverage reports.
- `--output-dir` - Required, path to folder where generated HTML files should be stored
- `--compact=true` - Optional, uses [compact variant of HTML table](https://burdiuz.github.io/traceability-matrices/generated_coverage_compact/features/Records-_-Category.html), categories displayed as rows instead of columns. Default value is false. Might be preferable way of rendering features with deep structures.
- `--force-cleanup=true` - Will remove all contents of output folder before generating new content.

Example:

```
traceability-matrices generate --target-dir=cypress/coverage --output-dir=coverage-static
```

### traceability-matrices threshold

Fails(exits with an error code) if coverage thresholds weren't met.  
Parameters:

- `--target-dir` - Required, path to directory with coverage reports.
- `--total` - Optional, defines global coverage threshold, value can be between 0 and 100. Fails command if combined coverage of all features does not meet threshold.
- `--per-feature` - Optional, defines coverage threshold applied to each feature, value can be between 0 and 100. Fails command if at least one feature does not meet threshold.

Example:

```
traceability-matrices threshold --target-dir=cypress/coverage --total=80 --per-feature=60
```

![Threshold command output](https://github.com/burdiuz/traceability-matrices/blob/master/screenshots/threshold.png?raw=true)

### traceability-matrices stats

Outputs coverage information per feature with requirements.

Parameters:

- `--target-dir` - Required, path to directory with coverage reports.

Example:

```
traceability-matrices stats --target-dir=cypress/coverage
```

![Stats command output](https://github.com/burdiuz/traceability-matrices/blob/master/screenshots/stats.png?raw=true)

### traceability-matrices lcov

Generates a LCOV file with test coverage and file stricture with features information that can be used as source files which were targets for coverage. This can be used with any coverage reader or analyser tool like [SonarQube](https://www.sonarsource.com/products/sonarqube/).

Parameters:

- `--target-dir` - Required, path to directory with coverage reports.
- `--output-dir` - Folder where to store LCOV coverage information and generated "source" files which can be used as a reference coverage reading tools.
- `--relative-dir` - Used to prepend file paths in coverage reports. By default recorded path to genrated sources will be `lcov/*`.
- `--force-cleanup=true` - Will remove all contents of output folder before generating new content.

Example:

```
traceability-matrices lcov --target-dir=coverage --output-dir=generated_coverage_lcov --relative-dir=generated_coverage_lcov
```

With tools like SonarQube you can track the change of features coverage in time and setup thresholds.
![SonarQube updates feed](https://github.com/burdiuz/traceability-matrices/blob/master/screenshots/sonarqube_coverage_change.png?raw=true)

File list in SonarQube does not show any useful information except coverage percentage because generated "source" 100% consists of comments.
![File list in SonarQube](https://github.com/burdiuz/traceability-matrices/blob/master/screenshots/sonarqube_coverage_files.png?raw=true)

Contents of the feature file, SonarQube shows uncovered requirements
![Stats command output](https://github.com/burdiuz/traceability-matrices/blob/master/screenshots/sonarqube_coverage_feature.png?raw=true)

> This SonarQube configuration required to configure it to read \*.md files as JavaScript files to make it display coverage information for them.

### traceability-matrices scan

Searches provided directories for supported feature files and creates report in target dir. Created report is a hidden coverage report with no coverage, this way all found features will be added to report even if they weren't used in tests.

Parameters:

- `--features-dir` - Required, path to a directory with feature files, can be added multiple times if features stored in different folders. Sub-directories will also be scanned recursively.
- `--target-dir` - Required, path to a directory with coverage reports.

Example:

```
traceability-matrices scan --features-dir=./cypress/features --target-dir=coverage
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

and defining a feature in a test file

```js
import { createFeature } from "@actualwave/traceability-matrices/cypress";

const feature = createFeature({
  title: "My Feature",
  description: "This is a description of my new feature",
  group: "Features",
});
```

`createFeature({ title: string, description?: string, group?: string })` accepts feature title and optionally description and group. Feature titles must be unique strings. Feature description could be an HTML string, it will display on top of feature coverage table and is suitable for placing various feature links and other useful information. Group will be used in a list of features to display features under same group and visually separate them from other.

```ts
import { createFeature } from "@actualwave/traceability-matrices/cypress";

const feature = createFeature({
  title: "My Feature",
  description: `
<h1>Useful information</h1>
<a href="https://react.dev/">Learn React</a>`,
  group: "Features",
});
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

it will be matched to a leaf node of the structure. If requirement could not be found in the structure, it will be added to the root of the structure when coverage is generated.

Without structure containing all feature requirements, the feature will have 100% coverage because there will be only requirements added from traces placed in specs(which are already marked as covered). Having structure with all feature requirements allows proper coverage calculation. For coverage calculation it does not matter(purely visual benefit) if structure is flat or organised into categories.

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

### feature.category()

`category()` method allows to specify category path for traced requirements. It returns an object with `category()`, `trace()` and `requirement()` functions. If feature contains identical requirement in multiple places using `trace()` from specific category helps to locate exact requirement.
For example, if we have this structure

```js
{
  "Requirement 1": null,
  "Requirement 2": null,
  "Category 1": {
    "Requirement 1": null,
    "Requirement 2": null,
  },
  "Category 2": {
    "Requirement 1": null,
    "Requirement 2": null,
  },
}
```

Tracing requirement `Requirement 1` from a future level will lookup for a first requirement occurance, so all traces will be recorded on `Requirement 1` in a root category.

```js
it("should trace requirement 1 from category 2", () => {
  feature.trace("Requirement 1");
});
```

Using `trace()` from a specific category helps to point at requirement on its level.

```js
const category1 = feature.category("Category 2");

it("should trace requirement 1 from category 2", () => {
  category1.trace("Requirement 1");
});
```

This will trace `Requirement 1` from `Category 2`.

This function can be used multiple times and it accepts multiple categories for deeply nested requirements.

```js
const child = feature.category("Parent Category", "Child Category");
```

These two examples are equivalent.

```js
const parent = feature.category("Parent Category");
const child = parent.category("Child Category");
```

### feature.setTraceToRequirementMatcher()

In some cases it might be not comfortable to put whole requirement text into traces in test files. Using this function requirements can be looked up using unique identifiers. It accepts a custom function that will be called with traced string and a strucutre object, its purpose to identify and return requirement text or a path array `[category, ..., requirement]` that points at specific requirement in a structure.

```js
import {
  createFeature,
  readStructureRequirements,
} from "@actualwave/traceability-matrices/cypress";

const Feature = createFeature({
  title: "Requirement matcher",
  group: "Features",
});

Feature.structure(
  {
    High: {
      "HR-1 Requirement text is so long that might be difficult to use in tests.":
        null,
      "HR-2 Requirement text is so long that might be difficult to use in tests.":
        null,
      "HR-3 Requirement text is so long that might be difficult to use in tests.":
        null,
    },
    "RR-1 Requirement text is so long that might be difficult to use in tests.":
      null,
    "RR-2 Requirement text is so long that might be difficult to use in tests.":
      null,
    "RR-3 Requirement text is so long that might be difficult to use in tests.":
      null,
  },
  ["Category", "Requirement"]
);

Feature.setTraceToRequirementMatcher(({
  name,
  structure
}) => {
  if (name instanceof Array) {
    return name;
  }

  /*
   * readStructureRequirements() reads structure and returns all requirements in a form of 2-dimensional array
   * [
   *   [requirement, path]
   * ]
   *
   * where
   *  requirement - requirement text
   *  path - an array or strings that identifies requirement in a structure
   */
  const reqs = readStructureRequirements(structure);
  const [, path] = reqs.find(([key]) => key.startsWith(name));

  return path || name;
});

describe("Matcher", () => {
  describe("High category requirements", () => {
    it("trace second requirement", () => {
      /*
       * this trace will use matcher to identify requirement using inuque identifier
       * matcher will result with
       *  [
       *   "High",
       *   "HR-2 Requirement text is so long that might be difficult to use in tests."
       *  ]
       */
      Feature.trace("HR-2");
    });
  });
});
```

`category()` allows setting custom matcher for its requirements and sub-category requirements.

```js
const RootCategory = feature.category("Root Category");
RootCategory.setTraceToRequirementMatcher(findRootCategoryRequirement);

const ChildCategory = feature.category("Root Category", "Child Category");
ChildCategory.setTraceToRequirementMatcher(findChildCategoryRequirement);

const DescendantCategory = ChildCategory.category("Descendant Category");
DescendantCategory.setTraceToRequirementMatcher(
  findDescendantCategoryRequirement
);
```

> Removing a matcher(by setting to `undefined`) will revert to using parent category or feature matcher if set.

When setting matcher to a category, it is not being assigned to a category by its path, but into objects internal state.
So, when called `category()` on same category next time returned object will not have the same matcher.

```js
const ChildCategory1 = feature.category("Root Category", "Child Category");
// setting matcher to ChildCategory1
ChildCategory1.setTraceToRequirementMatcher(findChildCategoryRequirement);

// it does not have the matcher previously set to same category but different object,
// you have to set it again for ChildCategory2 to make it work for this object
const ChildCategory2 = feature.category("Root Category", "Child Category");
// now it also has the matcher
ChildCategory2.setTraceToRequirementMatcher(findChildCategoryRequirement);
```

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

## Parsers

This project includes parsers that allow reading feature information from various file types. All of them return feature API object and work in a same way, just like object returned from `createFeature()`.

### Markdown

Markdown file structure should start with 1st level header which will be parsed as a feature title. If title has a slash in it, it will be split into group and title.

```markdown
# Feature Group / Feature Title

This is the text of feature description, may contain images, links etc.
```

Any text without below title is used as a feature description.
Structure of the feature marked with lower level headers and lists.

```markdown
- Requirement 1

# Category

- Requirement 2

## Sub Category

- Requirement 3
```

Converts into feature struture:

- Requirement 1
- Category
  - Requirement 2
  - Sub Category
  - Requirement 3

Same structure can be described with headers only

```markdown
# Requirement 1

# Category

## Requirement 2

## Sub Category

### Requirement 3
```

Or lists only

```markdown
- Requirement 1
- Category
  - Requirement 2
  - Sub Category
    - Requirement 3
```

Category defined by availability of lower level headers or lists below it.

```markdown
# This is a category

## Because this lower level header exists
```

If header has no lower level headers below, it will be parsed as a requirement.

```markdown
# This is not a category because there are no lower level headers or lists under it

# Category

## Requirement
```

Any text under the header will be merged with requirement or category text.

```markdown
# Category

More text with some details about this category

## Requirement
```

Feature example

```markdown
# Parsers / Feature Markdown

My feature description with [HTML](https://google.com)

## High

- High Requirement 1
- High Requirement 2
- High Requirement 3
```

Usage in cypress test

```js
import { createFeatureFromMarkdownAsync } from "@actualwave/traceability-matrices/markdown";

const Feature = createFeatureFromMarkdownAsync(
  "cypress/features/ParserMarkdown.md"
);

describe("Markdown", () => {
  describe("High requirements", () => {
    it("trace high requirements", () => {
      Feature.trace("High Requirement 2");
    });
  });
});
```

### YAML

YAML should have these properties on the root level

- `title: string` - Feature name, required.
- `structure: object` - Feature structure, required.
- `description: string` - Feature description, optional. May contain HTML tags.
- `group: string` - Feature group, optional.
  Structure object should contain feature requirements. Requirement field may have any primitive or an empty object as a value. It may also contain arrays or other objects with fields, these will be treated as categories.

```yaml
structure:
  Requirement 1: null
  Category:
    Requirement 2:
    Sub Category:
      - Requirement 3
```

> Structure cannot have empty categories -- empty objects will be parsed as requirements.

Feature example:

```yaml
title: Feature Yaml
description: My feature description with <a href=\"https://google.com\">HTML</a>
group: Parsers
structure:
  High:
    - High Requirement 1
    - High Requirement 2
    - High Requirement 3
```

Usage in cypress test

```js
import { createFeatureFromYamlAsync } from "@actualwave/traceability-matrices/yaml";

const Feature = createFeatureFromYamlAsync("cypress/features/ParserYaml.yaml");

describe("YAML", () => {
  describe("High requirements", () => {
    it("trace high requirements", () => {
      Feature.trace("High Requirement 2");
    });
  });
});
```

### XML

XML file structure starts with a root tag `feature`. It should contain these tags

- `title` - Feature title, required.
- `structure` - Feature structure, required.
- `description` - Feature description, optional.
- `group` - Feature group, optional.

> Value is the text content and child nodes, tag attributes are ignored.

Structure is described with two tags `category` for categories and `requirement` for requirements. Category tag should contain a `name` tag that will contain category name and `requirment` tags to specify this category requirements, it may also contain other `category` tags for sub-categories.

```xml
<structure>
  <requirement>Requirement 1</requirement>
  <catgegory>
    <name>Category</name>
    <requirement>Requirement 2</requirement>
    <catgegory>
      <name>Sub Category</name>
      <requirement>Requirement 3</requirement>
    </category>
  </category>
</structure>
```

> Structure cannot contain empty categories, they will be converted into requirements.

Feature example:

```xml
<feature>
  <title>Feature Xml</title>
  <description
    >My feature description with
    <a href="https://google.com">HTML</a></description
  >
  <group>Parsers</group>
  <category>
    <name>High</name>
    <requirement>High Requirement 1</requirement>
    <requirement>High Requirement 2</requirement>
    <requirement>High Requirement 3</requirement>
  </category>
</feature>
```

Usage in cypress test

```js
import { createFeatureFromXmlAsync } from "@actualwave/traceability-matrices/xml";

const Feature = createFeatureFromXmlAsync("cypress/features/ParserXml.xml");

describe("XML", () => {
  describe("High requirements", () => {
    it("trace high requirements", () => {
      Feature.trace("High Requirement 1");
      Feature.trace("High Requirement 2");

      // using full path
      Feature.trace(["High", "High Requirement 3"]);
    });
  });
});
```

### HTML

HTML praser uses `data-` attributes to find feature-related information and may have any kind of tags. Tags without proper data-attributes are ignored.
Supported attributes

- `data-feature-title` - Feature title, should have value
- `data-feature-group` - Feature group, shold have value and must be plaved on same element as title attribute.
- `data-feature-description` - Feature description. If no value defined as a description will be taked HTML content of the element.
- `data-feature-requirement` - Structure requirement, will be added to feature structure. If element with this attribute placed into category element, requirement will be added to corresponding category. Should define requirement name in the attribute value.
- `data-feature-category` - Structure category, all requirements defined in descendants of this category element will also be descendants of this category in feature structure. Structure will repeat the structure of HTML tree ignoring all elements not containig category or requirement attributes. Should define category name in the attribute value.

HTML feature example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>HTML Feature Document</title>
  </head>
  <body>
    <h1 data-feature-title="Feature Html" data-feature-group="Parsers">
      Feature HTML
    </h1>
    <strong data-feature-description
      >My feature description with <a href="https://google.com">HTML</a></strong
    >
    <h4>Structure</h4>
    <span data-feature-requirement="Requirement 1"
      >Some freature requirement</span
    >
    <strong>Structure Category</strong>
    <ul data-feature-category="Category">
      <li data-feature-requirement="Requirement 2">Requirement 2</li>
      <li data-feature-category="Sub category">
        <strong>Sub category structure</strong>
        <ul>
          <li data-feature-requirement="Requirement 3">
            Sub category Requirement 3
          </li>
        </ul>
      </li>
    </ul>
  </body>
</html>
```

Usage in cypress test

```js
import { createFeatureFromHtmlAsync } from "@actualwave/traceability-matrices/html";

const Feature = createFeatureFromHtmlAsync("cypress/features/ParserHtml.html");

describe("HTML", () => {
  describe("Category requirements", () => {
    it("trace category requirements", () => {
      Feature.trace("Requirement 2");

      // using full path
      Feature.trace(["Category", "Sub category", "Requirement 3"]);
    });
  });
});
```

### JSON

JSON file structure should have these properties on the root level

- `title: string` - Feature name, required.
- `structure: object` - Feature structure, required.
- `description: string` - Feature description, optional. May contain HTML tags.
- `group: string` - Feature group, optional.
  Structure object should contain feature requirements. Requirement field may have any primitive or an empty object as a value. It may also contain other objects with fields, these will be treated as categories.

```json
"structure": {
  "Requirement 1": null,
  "Category": {
    "Requirement 2": "",
    "Sub Category": {
      "Requirement 3": {},
    }
  }
}
```

> Structure cannot have empty categories -- empty objects will be parsed as requirements.

Feature example:

```json
{
  "title": "Feature Json",
  "description": "My feature description with <a href=\"https://google.com\">HTML</a>",
  "group": "Parsers",
  "structure": {
    "High": {
      "High Requirement 1": {},
      "High Requirement 2": {},
      "High Requirement 3": {}
    }
  }
}
```

Usage in cypress test

```js
import { createFeatureFromJsonAsync } from "@actualwave/traceability-matrices/json";

const Feature = createFeatureFromJsonAsync("cypress/features/ParserJson.json");

describe("JSON", () => {
  describe("High requirements", () => {
    it("trace high requirements", () => {
      Feature.trace("High Requirement 1");
      Feature.trace("High Requirement 2");

      // using full path
      Feature.trace(["High", "High Requirement 3"]);
    });
  });
});
```

## Links

For latest version of reporting UI I've used couple free [FontAwesome icons](https://fontawesome.com/).
