import {
  afterEach,
  jest,
  describe,
  beforeEach,
  it,
  expect,
} from "@jest/globals";

describe("Cypress Integration", () => {
  let readStructureRequirements;
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

    ({ createFeature, readStructureRequirements } = await import(
      "../index.ts"
    ));
  });

  afterEach(() => {
    delete global.tm_features;
    jest.resetModules();
    global.after.mockReset();
  });

  beforeEach(() => {
    feature = createFeature({
      title: "Categories",
      description: "Testing per Category tracing",
      group: "Records",
    });

    feature.structure({
      "ROOT-1 Requirement": null,
      "ROOT-2 Requirement": null,
      "ROOT-3 Requirement": null,
      Category: {
        "CAT-1 Requirement": null,
        "CAT-2 Requirement": null,
        "CAT-3 Requirement": null,
        "Sub-category": {
          "SUB-1 Requirement": null,
          "SUB-2 Requirement": null,
          "SUB-3 Requirement": null,
        },
      },
    });
  });

  describe("When using root matcher", () => {
    beforeEach(() => {
      feature.setTraceToRequirementMatcher((params) => {
        expect(params).toEqual({
          name: "2",
          branch: null,
          structure: feature.valueOf().structure,
          categoryPath: [],
        });

        const reqs = readStructureRequirements(params.structure);
        const [, path] = reqs.find(([name]) =>
          name.startsWith(`ROOT-${params.name}`)
        );

        return path;
      });
    });

    it("should lookup using root matcher", () => {
      feature.trace("2");

      expect(feature.valueOf().records[0]).toEqual(
        expect.objectContaining({
          category: [],
          requirement: "ROOT-2 Requirement",
        })
      );
    });
  });

  describe("When using category matcher", () => {
    let category;

    beforeEach(() => {
      category = feature.category("Category");

      category.setTraceToRequirementMatcher((params) => {
        expect(params).toEqual({
          name: "1",
          branch: feature.valueOf().structure.Category,
          structure: feature.valueOf().structure,
          categoryPath: ["Category"],
        });

        const reqs = readStructureRequirements(params.branch);
        const [, path] = reqs.find(([name]) =>
          name.startsWith(`CAT-${params.name}`)
        );

        return path;
      });
    });

    it("should lookup using category matcher", () => {
      category.trace("1");

      expect(feature.valueOf().records[0]).toEqual(
        expect.objectContaining({
          category: ["Category"],
          requirement: "CAT-1 Requirement",
        })
      );
    });

    describe("When using sub-category matcher", () => {
      let subCategory;

      beforeEach(() => {
        subCategory = category.category("Sub-category");

        subCategory.setTraceToRequirementMatcher((params) => {
          expect(params).toEqual({
            name: "3",
            branch: feature.valueOf().structure.Category["Sub-category"],
            structure: feature.valueOf().structure,
            categoryPath: ["Category", "Sub-category"],
          });

          const reqs = readStructureRequirements(params.branch);
          const [, path] = reqs.find(([name]) =>
            name.startsWith(`SUB-${params.name}`)
          );

          return path;
        });
      });

      it("should lookup using sub-category matcher", () => {
        subCategory.trace("3");

        expect(feature.valueOf().records[0]).toEqual(
          expect.objectContaining({
            category: ["Category", "Sub-category"],
            requirement: "SUB-3 Requirement",
          })
        );
      });

      describe("When removing sub-category matcher", () => {
        beforeEach(() => {
          subCategory.setTraceToRequirementMatcher(undefined);
        });

        it("should lookup using category matcher", () => {
          subCategory.trace("1");

          expect(feature.valueOf().records[0]).toEqual(
            expect.objectContaining({
              category: ["Category"],
              requirement: "CAT-1 Requirement",
            })
          );
        });
      });
    });
  });

  describe("When using multipath category", () => {
    let category;

    beforeEach(() => {
      category = feature.category("Category", "Sub-category");

      category.setTraceToRequirementMatcher((params) => {
        expect(params).toEqual({
          name: "1",
          branch: feature.valueOf().structure.Category["Sub-category"],
          structure: feature.valueOf().structure,
          categoryPath: ["Category", "Sub-category"],
        });

        const reqs = readStructureRequirements(params.branch);
        const [, path] = reqs.find(([name]) =>
          name.startsWith(`SUB-${params.name}`)
        );

        return path;
      });
    });

    it("should lookup using category matcher", () => {
      category.trace("1");

      expect(feature.valueOf().records[0]).toEqual(
        expect.objectContaining({
          category: ["Category", "Sub-category"],
          requirement: "SUB-1 Requirement",
        })
      );
    });
  });
});
