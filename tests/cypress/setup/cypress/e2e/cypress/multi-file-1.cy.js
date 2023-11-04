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
    Medium: {
      "Requirement 1": null,
      "Requirement 2": null,
      "Requirement 3": null,
    },
  },
  ["Main categories", "Requirements"]
);

describe("Multi-feature setup", () => {
  it("tracing A and C", () => {
    FeatureA.trace(["High", "Requirement 1"]);
    FeatureA.trace(["High", "Requirement 3"], () => {
      FeatureC.trace(["Medium", "Requirement 1"]);
      FeatureC.trace(["Medium", "Requirement 3"]);
    });
  });

  it("tracing B and C", () => {
    FeatureC.trace(["Medium", "Requirement 1"]);
    FeatureC.trace(["Medium", "Requirement 3"], () => {
      FeatureB.trace(["Low", "Requirement 1"]);
      FeatureB.trace(["Low", "Requirement 3"]);
    });
  });

  it("tracing A and B and C", () => {
    FeatureA.trace(["High", "Requirement 1"]);
    FeatureA.trace(["High", "Requirement 3"]);
    FeatureB.trace(["Low", "Requirement 1"]);
    FeatureB.trace(["Low", "Requirement 3"]);
    FeatureC.trace(["Medium", "Requirement 1"]);
    FeatureC.trace(["Medium", "Requirement 3"]);
  });
});
