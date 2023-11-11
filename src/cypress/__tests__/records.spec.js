import {
  afterEach,
  jest,
  describe,
  beforeEach,
  it,
  expect,
} from "@jest/globals";

describe("Cypress Integration", () => {
  let createFeature;
  let feature;

  beforeEach(async () => {
    global.Cypress = {
      currentTest: {
        title: "Le test",
        titlePath: ["Describe", "Le test"],
      },
      env: jest.fn(() => "coverage"),
      spec: {
        relative: "source/folder/file.js",
      },
    };

    ({ createFeature } = await import("../index.ts"));
  });

  afterEach(() => {
    delete global.tm_features;
    jest.resetModules();
    global.after.mockReset();
    global.it.mockReset();
    global.describe.mockReset();
  });

  beforeEach(() => {
    feature = createFeature({
      title: "Test Feature",
      description: "Description",
      group: "Group",
    });
  });

  describe("Records", () => {
    describe("trace()", () => {
      it("should record one test", () => {
        feature.trace("req1");
        feature.trace("req2");

        global.Cypress = {
          currentTest: {
            title: "Another test spec",
            titlePath: ["Another test spec"],
          },
          spec: {
            relative: "source/folder/another-file.js",
          },
        };

        feature.trace("req3");
        expect(feature.valueOf()).toMatchInlineSnapshot(`
{
  "description": "Description",
  "group": "Group",
  "headers": [],
  "records": [
    {
      "category": [],
      "filePath": "source/folder/file.js",
      "requirement": "req1",
      "title": "Le test",
      "titlePath": [
        "Describe",
        "Le test",
      ],
    },
    {
      "category": [],
      "filePath": "source/folder/file.js",
      "requirement": "req2",
      "title": "Le test",
      "titlePath": [
        "Describe",
        "Le test",
      ],
    },
    {
      "category": [],
      "filePath": "source/folder/another-file.js",
      "requirement": "req3",
      "title": "Another test spec",
      "titlePath": [
        "Another test spec",
      ],
    },
  ],
  "structure": {},
  "title": "Test Feature",
  "valueOf": [Function],
}
`);
      });

      describe("When multiple nested requirements", () => {
        beforeEach(() => {
          feature.trace("req1", () => {
            feature.trace("req1");
            feature.trace("req2");
            feature.trace("req3", () => {
              feature.trace("req2");
              feature.trace("req4");
            });
          });
        });

        it("should record multiple tests", () => {
          expect(feature.valueOf()).toMatchInlineSnapshot(`
{
  "description": "Description",
  "group": "Group",
  "headers": [],
  "records": [
    {
      "category": [],
      "filePath": "source/folder/file.js",
      "requirement": "req1",
      "title": "Le test",
      "titlePath": [
        "Describe",
        "Le test",
      ],
    },
    {
      "category": [],
      "filePath": "source/folder/file.js",
      "requirement": "req1",
      "title": "Le test",
      "titlePath": [
        "Describe",
        "Le test",
      ],
    },
    {
      "category": [],
      "filePath": "source/folder/file.js",
      "requirement": "req2",
      "title": "Le test",
      "titlePath": [
        "Describe",
        "Le test",
      ],
    },
    {
      "category": [],
      "filePath": "source/folder/file.js",
      "requirement": "req3",
      "title": "Le test",
      "titlePath": [
        "Describe",
        "Le test",
      ],
    },
    {
      "category": [],
      "filePath": "source/folder/file.js",
      "requirement": "req2",
      "title": "Le test",
      "titlePath": [
        "Describe",
        "Le test",
      ],
    },
    {
      "category": [],
      "filePath": "source/folder/file.js",
      "requirement": "req4",
      "title": "Le test",
      "titlePath": [
        "Describe",
        "Le test",
      ],
    },
  ],
  "structure": {},
  "title": "Test Feature",
  "valueOf": [Function],
}
`);
        });
      });
    });

    describe("requirement()", () => {
      beforeEach(() => {
        feature.requirement("requirement traced").trace(() => {
          feature.requirement("requirement in a callback").trace();
        });
        feature
          .requirement("requirement it()")
          .it("should bla-bla-bla", () => {});
        feature
          .requirement("High", "PRD II", "requirement describe()")
          .describe("Test group", () => {});

        // call callback function passed to it()
        global.it.mock.calls[0][1]();

        global.Cypress = {
          currentTest: {
            title: "Another test spec",
            titlePath: ["Another test spec"],
          },
          spec: {
            relative: "source/folder/another-file.js",
          },
        };

        // call callback function passed to describe()
        global.describe.mock.calls[0][1]();
      });

      it("should generate structure and records", () => {
        expect(feature.valueOf()).toMatchInlineSnapshot(`
{
  "description": "Description",
  "group": "Group",
  "headers": [],
  "records": [
    {
      "category": [],
      "filePath": "source/folder/file.js",
      "requirement": "requirement traced",
      "title": "Le test",
      "titlePath": [
        "Describe",
        "Le test",
      ],
    },
    {
      "category": [],
      "filePath": "source/folder/file.js",
      "requirement": "requirement in a callback",
      "title": "Le test",
      "titlePath": [
        "Describe",
        "Le test",
      ],
    },
    {
      "category": [],
      "filePath": "source/folder/file.js",
      "requirement": "requirement it()",
      "title": "Le test",
      "titlePath": [
        "Describe",
        "Le test",
      ],
    },
    {
      "category": [],
      "filePath": "source/folder/another-file.js",
      "requirement": [
        "High",
        "PRD II",
        "requirement describe()",
      ],
      "title": "Another test spec",
      "titlePath": [
        "Another test spec",
      ],
    },
  ],
  "structure": {},
  "title": "Test Feature",
  "valueOf": [Function],
}
`);
      });
    });

    it("should throw an error for category path tracing", () => {
      feature.structure({
        Category: {
          Requirement: null,
        },
      });

      expect(() => {
        feature.trace(["Category"]);
      }).toThrowError(`Path ["Category"]
refers to a category in a feature structure.
Categories cannot be traced, please specify a requirement(leaf node of the feature structure) for tracing.`);
    });

    it("should throw an error for category tracing", () => {
      feature.structure({
        Category: {
          Requirement: null,
        },
      });

      expect(() => {
        feature.trace("Category");
      }).toThrowError(`Path ["Category"]
refers to a category in a feature structure.
Categories cannot be traced, please specify a requirement(leaf node of the feature structure) for tracing.`);
    });
  });
});
