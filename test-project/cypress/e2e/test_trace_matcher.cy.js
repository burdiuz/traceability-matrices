import { createFeature } from "@actualwave/traceability-matrices/cypress";

const Feature = createFeature("Feature Matcher");

Feature.structure({
  Statics: {
    "S001 Add header text": {},
    "S002 Path to App.js should be visible": {},
    "S003 Add welcome text": {},
  },
  Interactive: {
    Redirects: {
      "High Priority": {
        "IRH001 Redirect to reactjs.org": {},
      },
      'IR001 Link with text "Learn React"': {},
    },
  },
  "001 SVG logo preset on the page": {},
});

Feature.setTraceToRequirementMatcher((name, requirements) => {
  const req = Object.keys(requirements).find((key) => key.indexOf(name) === 0);

  return req || name;
});

describe("React App", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000/");
  });

  it("should display help text", () => {
    Feature.trace("S001", () => {
      Feature.trace("S003");

      cy.get(".App-header p").should("contain", "save to reload.");
    });
  });

  it("should display entry point path", () => {
    Feature.trace("S002");

    cy.get(".App-header p > code").should("contain", "src/App.js");
  });

  describe("Graphics", () => {
    it("should display logo", () => {
      Feature.trace("001");

      cy.get(".App-header .App-logo").should("exist");
    });
  });

  describe("Redirects", () => {
    it("should have a link with proper text", () => {
      Feature.trace("IR001");

      cy.get("a.App-link").should("contain", "Learn React");
    });

    context("Links", () => {
      it("should have a react offsite link", () => {
        Feature.trace("IRH001");

        cy.get(".App-link")
          .invoke("attr", "href")
          .should("eq", "https://reactjs.org");
      });
    });
  });
});
