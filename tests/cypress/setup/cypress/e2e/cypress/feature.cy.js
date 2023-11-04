import { createFeature } from "@actualwave/traceability-matrices/cypress";

const Feature = createFeature({
  title: "Feature",
  description: "Testing Feature API",
  group: "Features",
});

Feature.structure({
  High: {
    "High Requirement 1": null,
    "High Requirement 2": null,
    "High Requirement 3": null,
  },
  Medium: {
    "Medium Requirement 1": null,
    "Medium Requirement 2": null,
    "Medium Requirement 3": null,
    "Sub-category": {
      "Sub Requirement 1": null,
      "Sub Requirement 2": null,
      "Sub Requirement 3": null,
    },
  },
});

Feature.structure().merge({
  Low: {
    "Low Requirement 1": null,
    "Low Requirement 2": null,
  },
  "Optional Requirement 1": null,
  "Optional Requirement 2": null,
  "Optional Requirement 3": null,
});

Feature.structure().add("Low", "Low Requirement 3");

Feature.headers(["Main categories", "Subs"]);
Feature.headers().set(1, "Sub categories");
Feature.headers().set(2, "Requirements");

const Narrow = Feature.narrow({
  title: "Feature Narrowed to Medium Category",
  description: "Testing Feature narrowing API",
  group: "Features",
  path: ["Medium"],
});

const Branch = Feature.branch({
  title: "Feature Medium branch",
  description: "Testing Feature branching API",
  group: "Features",
  path: ["Medium"],
});

const Cloned = Feature.clone({
  title: "Cloned Feature",
  description: "Test Feature cloning functionality",
  group: "Features",
});

describe("Feature", () => {
  describe("Narrowed", () => {
    it("trace main requirements", () => {
      Narrow.trace("Medium Requirement 1");
      Narrow.trace("Medium Requirement 3");
    });

    it("trace sub category", () => {
      Narrow.trace(["Medium", "Sub-category", "Sub Requirement 1"]);
      Narrow.trace(["Medium", "Sub-category", "Sub Requirement 3"]);
    });

    it("trace custom requirements", () => {
      Narrow.trace("Custom Requirement 1");
      Narrow.trace(["Custom category", "Custom Requirement 2"]);
    });
  });

  describe("Branch", () => {
    it("trace main requirements", () => {
      Branch.trace("Medium Requirement 1");
      Branch.trace("Medium Requirement 3");
    });

    it("trace sub category", () => {
      Branch.trace(["Sub-category", "Sub Requirement 1"]);
      Branch.trace(["Sub-category", "Sub Requirement 3"]);
    });

    it("trace custom requirements", () => {
      Branch.trace("Custom Requirement 1");
      Branch.trace(["Custom category", "Custom Requirement 2"]);
    });
  });

  describe("Cloned", () => {
    it("trace low requirements", () => {
      Cloned.trace("Low Requirement 1");
      Cloned.trace("Low Requirement 3");
    });

    it("trace custom requirements", () => {
      Cloned.trace("Cloned Custom Requirement 1");
      Cloned.trace(["Cloned Custom category", "Cloned Custom Requirement 2"]);
    });
  });
});
