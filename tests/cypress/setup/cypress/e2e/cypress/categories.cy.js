import { createFeature } from "@actualwave/traceability-matrices/cypress";

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
});
