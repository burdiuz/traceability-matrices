import { createFeature } from "@actualwave/traceability-matrices/cypress";

const FeatureA = createFeature({
  title: "Feature A",
  description: "Testing Multifile Feature composition",
  group: "Features",
});

FeatureA.structure(
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
    },
    Low: {
      "Requirement 1": null,
      "Requirement 2": null,
      "Requirement 3": null,
    },
  },
  ["Main categories", "Requirements"]
);

const FeatureB = createFeature({
  title: "Feature B",
  description: "Testing Multifile Feature composition",
  group: "Features",
});

FeatureB.structure(
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
    },
    Low: {
      "Requirement 1": null,
      "Requirement 2": null,
      "Requirement 3": null,
    },
  },
  ["Main categories", "Requirements"]
);

const FeatureC = createFeature({
  title: "Feature C",
  description: "Testing Multifile Feature composition",
  group: "Features",
});

FeatureC.structure(
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
    },
    Low: {
      "Requirement 1": null,
      "Requirement 2": null,
      "Requirement 3": null,
    },
  },
  ["Main categories", "Requirements"]
);

describe("Multi-feature setup", () => {
  it("tracing A", () => {
    FeatureA.trace(["Medium", "Requirement 1"]);
    FeatureA.trace(["Medium", "Requirement 3"]);
  });

  it("tracing B", () => {
    FeatureB.trace(["High", "Requirement 1"]);
    FeatureB.trace(["High", "Requirement 3"]);
  });

  it("tracing C", () => {
    FeatureC.trace(["Low", "Requirement 1"]);
    FeatureC.trace(["Low", "Requirement 3"]);
  });
});
