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
  });

  beforeEach(() => {
    feature = createFeature({
      title: "Test Feature",
      description: "Description",
      group: "Group",
    });
  });

  it("should generate base feature state", () => {
    expect(feature.valueOf()).toEqual({
      title: "Test Feature",
      description: "Description",
      group: "Group",
      structure: {},
      headers: [],
      records: [],
      valueOf: expect.any(Function),
    });
  });

  it("should execute after() hook", () => {
    expect(global.after).toHaveBeenCalledTimes(1);
    expect(global.after).toHaveBeenCalledWith(expect.any(Function));
  });

  describe("Feature cloning", () => {
    beforeEach(() => {
      feature.structure(
        {
          "Requirement 1": null,
          Category: {
            "Requirement 2": null,
            "Sub-Category": {
              "Requirement 3": null,
            },
          },
        },
        ["Category", "Sub category", "Requirement"]
      );
    });

    it("clone() should copy structure", () => {
      const cloned = feature.clone({
        title: "Cloned Feature",
        description: "Cloned description",
        group: "Cloned group",
      });

      expect(cloned.valueOf().structure).not.toBe(feature.valueOf().structure);
      expect(cloned.valueOf()).toEqual({
        title: "Cloned Feature",
        description: "Cloned description",
        group: "Cloned group",
        structure: {
          "Requirement 1": {},
          Category: {
            "Requirement 2": {},
            "Sub-Category": {
              "Requirement 3": {},
            },
          },
        },
        headers: ["Category", "Sub category", "Requirement"],
        records: [],
        valueOf: expect.any(Function),
      });
    });

    it("narrow() should narrow structure", () => {
      const narrow = feature.narrow({
        title: "Cloned Feature",
        description: "Cloned description",
        group: "Cloned group",
        path: ["Category"],
      });

      expect(narrow.valueOf().structure.Category).not.toBe(
        feature.valueOf().structure.Category
      );

      expect(narrow.valueOf()).toEqual({
        title: "Cloned Feature",
        description: "Cloned description",
        group: "Cloned group",
        structure: {
          Category: {
            "Requirement 2": {},
            "Sub-Category": {
              "Requirement 3": {},
            },
          },
        },
        headers: ["Category", "Sub category", "Requirement"],
        records: [],
        valueOf: expect.any(Function),
      });
    });

    it("branch() should copy branch structure", () => {
      const branch = feature.branch({
        title: "Cloned Feature",
        description: "Cloned description",
        group: "Cloned group",
        path: ["Category"],
      });

      expect(branch.valueOf().structure).not.toBe(
        feature.valueOf().structure.Category
      );

      expect(branch.valueOf()).toEqual({
        title: "Cloned Feature",
        description: "Cloned description",
        group: "Cloned group",
        structure: {
          "Requirement 2": {},
          "Sub-Category": {
            "Requirement 3": {},
          },
        },
        headers: ["Category", "Sub category", "Requirement"],
        records: [],
        valueOf: expect.any(Function),
      });
    });
  });
});
