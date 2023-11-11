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
  let category;
  let subCategory;
  let notExists;

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
      title: "Categories",
      description: "Testing per Category tracing",
      group: "Records",
    });

    feature.structure({
      "Requirement 1": null,
      "Requirement 2": null,
      "Requirement 3": null,
      Category: {
        "Requirement 1": null,
        "Requirement 2": null,
        "Requirement 3": null,
        "Sub-category": {
          "Requirement 1": null,
          "Requirement 2": null,
          "Requirement 3": null,
        },
      },
    });

    category = feature.category("Category");

    subCategory = category.category("Sub-category");

    notExists = category.category("Not Exists");
  });

  it("should record root level requirement", () => {
    feature.trace("Requirement 2");

    expect(feature.valueOf().records[0]).toEqual(
      expect.objectContaining({
        category: [],
        requirement: "Requirement 2",
      })
    );
  });

  it("should pass null branch to matcher", () => {
    feature.trace((params) => {
      expect(params).toEqual({
        branch: null,
        categoryPath: [],
        structure: feature.valueOf().structure,
      });

      return "Requirement 1";
    });

    expect(feature.valueOf().records[0]).toEqual(
      expect.objectContaining({
        category: [],
        requirement: "Requirement 1",
      })
    );
  });

  describe("When using category", () => {
    it("should record category requirement", () => {
      category.trace("Requirement 2");

      expect(feature.valueOf().records[0]).toEqual(
        expect.objectContaining({
          category: ["Category"],
          requirement: "Requirement 2",
        })
      );
    });

    it("should pass category branch to matcher", () => {
      category.trace((params) => {
        expect(params).toEqual({
          branch: feature.valueOf().structure.Category,
          categoryPath: ["Category"],
          structure: feature.valueOf().structure,
        });

        return "Requirement 1";
      });

      expect(feature.valueOf().records[0]).toEqual(
        expect.objectContaining({
          category: ["Category"],
          requirement: "Requirement 1",
        })
      );
    });
  });

  describe("When using sub-category", () => {
    it("should record category requirement", () => {
      subCategory.trace("Requirement 2");

      expect(feature.valueOf().records[0]).toEqual(
        expect.objectContaining({
          category: ["Category", "Sub-category"],
          requirement: "Requirement 2",
        })
      );
    });

    it("should pass sub-category branch to matcher", () => {
      subCategory.trace((params) => {
        expect(params).toEqual({
          branch: feature.valueOf().structure.Category["Sub-category"],
          categoryPath: ["Category", "Sub-category"],
          structure: feature.valueOf().structure,
        });

        return "Requirement 1";
      });

      expect(feature.valueOf().records[0]).toEqual(
        expect.objectContaining({
          category: ["Category", "Sub-category"],
          requirement: "Requirement 1",
        })
      );
    });
  });

  describe("When using non-existent category", () => {
    it("should record category requirement", () => {
      notExists.trace("Requirement 2");

      expect(feature.valueOf().records[0]).toEqual(
        expect.objectContaining({
          category: ["Category", "Not Exists"],
          requirement: "Requirement 2",
        })
      );
    });

    it("should pass null branch to matcher", () => {
      notExists.trace((params) => {
        expect(params).toEqual({
          branch: null,
          categoryPath: ["Category", "Not Exists"],
          structure: feature.valueOf().structure,
        });

        return "Requirement 1";
      });
    });
  });

  describe("requirement()", () => {
    beforeEach(() => {
      subCategory.requirement("requirement traced").trace(() => {
        category.requirement("requirement in a callback").trace();
      });
      subCategory
        .requirement("requirement it()")
        .it("should bla-bla-bla", () => {});
      subCategory
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
      expect(feature.valueOf().records).toMatchInlineSnapshot(`
[
  {
    "category": [
      "Category",
      "Sub-category",
    ],
    "filePath": "source/folder/file.js",
    "requirement": "requirement traced",
    "title": "Le test",
    "titlePath": [
      "Describe",
      "Le test",
    ],
  },
  {
    "category": [
      "Category",
    ],
    "filePath": "source/folder/file.js",
    "requirement": "requirement in a callback",
    "title": "Le test",
    "titlePath": [
      "Describe",
      "Le test",
    ],
  },
  {
    "category": [
      "Category",
      "Sub-category",
    ],
    "filePath": "source/folder/file.js",
    "requirement": "requirement it()",
    "title": "Le test",
    "titlePath": [
      "Describe",
      "Le test",
    ],
  },
  {
    "category": [
      "Category",
      "Sub-category",
    ],
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
]
`);
    });
  });
});
