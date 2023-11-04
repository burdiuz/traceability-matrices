import {
  createFeature,
  readStructureRequirements,
} from "@actualwave/traceability-matrices/cypress";

const Feature = createFeature({
  title: "Requirement",
  description: "Testing requirement() API",
  group: "Records",
});

Feature.structure({
  Hooks: {
    "describe()": null,
    "context()": null,
    "suite()": null,
    "it()": null,
    "specify()": null,
    "test()": null,
  },
  "Should allow trace as usual": null,
  "Should allow matcher function": null,
});

const req = Feature.requirement("Should allow trace as usual");

describe("Requirement API", () => {
  Feature.requirement("Hooks", "describe()").describe(
    "requirement().describe()",
    () => {
      it("should work as normal describe()", () => {
        cy.window(() => {});
      });
    }
  );

  Feature.requirement("Hooks", "context()").context(
    "requirement().context()",
    () => {
      it("should work as normal context()", () => {
        cy.window(() => {});
      });
    }
  );

  Feature.requirement("Hooks", "suite()").suite("requirement().suite()", () => {
    it("should work as normal suite()", () => {
      cy.window(() => {});
    });
  });

  Feature.requirement("Hooks", "test()").test("requirement().test()", () => {
    cy.window(() => {});
  });

  Feature.requirement("Hooks", "it()").it("requirement().it()", () => {
    cy.window(() => {});
  });

  Feature.requirement("Hooks", "specify()").specify(
    "requirement().specify()",
    () => {
      cy.window(() => {});
    }
  );

  it("requirement().trace()", () => {
    req.trace();
  });

  it("should use matcher to find proper requirement", () => {
    const matcher = (rgx) => (struct) => {
      const reqs = readStructureRequirements(struct);
      const [, path] = reqs.find(([requirement]) => rgx.test(requirement));

      return path;
    };

    Feature.requirement(matcher(/matcher/)).trace();
  });
});
