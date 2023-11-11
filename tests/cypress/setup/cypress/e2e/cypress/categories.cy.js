import { createFeature, readStructureRequirements } from "@actualwave/traceability-matrices/cypress";

const Feature = createFeature({
  title: "Category",
  description: "Testing per Category tracing",
  group: "Records",
});

Feature.structure(
  {
    High: {
      "Requirement 1": null,
      "Requirement 2": null,
      "Requirement 3": null,
    },
    Medium: {
      "Requirement 1": null,
      "Requirement 2": null,
      "Requirement 3": null,
      "Sub-category": {
        "Requirement 1": null,
        "Requirement 2": null,
        "Requirement 3": null,
      },
    },
    "Requirement 1": null,
    "Requirement 2": null,
    "Requirement 3": null,
  },
  ["Main categories", "Sub categories", "Requirements"]
);

const High = Feature.category("High");

const Medium = Feature.category("Medium");

const Sub = Feature.category("Medium", "Sub-category");

const Low = Feature.category("Low");

const Matchers = createFeature({
  title: "Category Matchers",
  description: "Testing Category matchers",
  group: "Records",
});

const SubCategoryStruct = {
  "Requirement 1": null,
  "Requirement 2": null,
  "Requirement 3": null,
};

const CategoryStruct = {
  "Requirement 1": null,
  "Requirement 2": null,
  "Requirement 3": null,
  "Sub Category": SubCategoryStruct,
};

const MatchersStruct = {
  "Requirement 1": null,
  "Requirement 2": null,
  "Requirement 3": null,
  Category: CategoryStruct,
};

Matchers.structure(MatchersStruct, [
  "Main categories",
  "Sub categories",
  "Requirements",
]);

const createMatcherFn =
  (expectedBranch) =>
  ({ name, branch, structure }) => {
    expect(branch).to.eql(expectedBranch);
    expect(structure).to.eql(MatchersStruct);

    const reqs = readStructureRequirements(branch || structure);
    const [, path] = reqs.find(([requirement]) => requirement.includes(name));

    return path;
  };

Matchers.setTraceToRequirementMatcher(createMatcherFn(null));

const MatchersCategory = Matchers.category("Category");
MatchersCategory.setTraceToRequirementMatcher(createMatcherFn(CategoryStruct));

const MatchersSubCategory = MatchersCategory.category("Sub Category");
MatchersSubCategory.setTraceToRequirementMatcher(
  createMatcherFn(SubCategoryStruct)
);

describe("Category", () => {
  describe("Using a first level category", () => {
    it("should allow High category tracing", () => {
      High.trace("Requirement 1");
      High.requirement("Requirement 3").trace();
    });

    it("should allow Medium category tracing", () => {
      Medium.trace("Requirement 1");
      Medium.requirement("Requirement 3").trace();
    });
  });

  describe("Using a second level category", () => {
    it("should allow direct tracing", () => {
      Sub.trace("Requirement 1");
      Sub.requirement("Requirement 3").trace();
    });

    it("should allow sub category tracing", () => {
      Medium.category("Sub-category").trace("Requirement 1");
      Medium.category("Sub-category").requirement("Requirement 3").trace();
    });
  });

  describe("Using a custom category tracing", () => {
    it("should allow direct tracing", () => {
      Low.trace("Requirement 1");
      Low.requirement("Requirement 3").trace();
    });

    it("should allow sub category tracing", () => {
      Low.category("Sub-category").trace("Requirement 1");
      Low.category("Sub-category").requirement("Requirement 3").trace();
    });
  });

  describe("Using category matchers", () => {
    it("should use root matcher", () => {
      Matchers.trace("1");
      Matchers.trace("3");
    });

    it("should use Category matcher", () => {
      MatchersCategory.trace("1");
      MatchersCategory.trace("3");
    });

    it("should use Sub Category matcher", () => {
      MatchersSubCategory.trace("1");
      MatchersSubCategory.trace("3");
    });
  });
});
