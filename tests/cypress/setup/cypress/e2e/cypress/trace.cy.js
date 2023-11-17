import {
  createFeature,
  readStructureRequirements,
} from "@actualwave/traceability-matrices/cypress";

const Feature = createFeature({
  title: "Trace",
  description: "Testing Feature tracing",
  group: "Records",
});

Feature.structure(
  {
    High: {
      "Requirement 1": null,
      "Requirement 2": null,
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
    Low: {
      "Requirement 1": null,
      "Requirement 2": null,
    },
    "Optional Requirement 1": null,
    "Optional Requirement 2": null,
    "Optional Requirement 3": null,
  },
  ["Main categories", "Sub categories", "Requirements"]
);

describe("Trace", () => {
  it("should allow tracing by requirement name", () => {
    Feature.trace("High Requirement 3");
  });

  it("should allow tracing same requirement multiple times 1", () => {
    Feature.trace(["High", "Requirement 1"]);
    Feature.trace("Requirement 2");
  });

  it("should allow tracing same requirement multiple times 2", () => {
    Feature.trace(["High", "Requirement 2"]);
  });

  it("should allow tracing same requirement multiple times 3", () => {
    Feature.trace("Requirement 2");
    Feature.trace(["High", "Requirement 1"]);
  });

  it("should allow tracing same requirement multiple times 4", () => {
    Feature.trace(["High", "Requirement 2"]);
  });

  it("should allow tracing by full path", () => {
    Feature.trace(["Low", "Requirement 1"]);
  });

  it("should use custom matcher passed directly into trace", () => {
    Feature.trace(() => "Medium Requirement 1");
    Feature.trace(() => "Medium Requirement 3");
  });

  it("should allow custom requirements", () => {
    Feature.trace("Custom Requirement 1");
    Feature.trace(["Custom Category", "Custom Requirement 2"]);
  });

  it("should call callback function and allow nesting", () => {
    Feature.trace("Optional Requirement 1", () => {
      Feature.trace("Optional Requirement 2", () => {
        Feature.trace("Optional Requirement 3", () => {
          cy.window().then(() => {});
        });

        cy.window().then(() => {});
      });

      cy.window().then(() => {});
    });
  });

  describe("When matcher is set", () => {
    beforeEach(() => {
      Feature.setTraceToRequirementMatcher(({ name, structure }) => {
        if (name instanceof Array) {
          return name;
        }

        const reqs = readStructureRequirements(structure);
        const rgx = new RegExp(`^Sub\\s.*${name}`);
        const [, path] = reqs.find(([key]) => rgx.test(key));

        return path || name;
      });
    });

    afterEach(() => {
      Feature.setTraceToRequirementMatcher(undefined);
    });

    it("should use matcher", () => {
      Feature.trace("1");
      Feature.trace("3");
    });

    it("should use custom matcher passed directly into trace", () => {
      Feature.trace(() => ["Medium", "Medium Requirement 1"]);
      Feature.trace(() => ["Medium", "Medium Requirement 3"]);
    });
  });
});
