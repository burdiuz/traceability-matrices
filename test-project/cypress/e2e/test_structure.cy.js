import { createFeature } from "@actualwave/traceability-matrices/cypress";

const Feature = createFeature({ title: "Feature C" });
Feature.structure({
  Statics: {
    "Add header text": {},
    "Path to App.js should be visible": {},
    "Add welcome text": {},
  },
  Interactive: {
    Redirects: {
      "High Priority": {
        "Redirect to reactjs.org": {},
      },
      'Link with text "Learn React"': {},
    },
  },
  "SVG logo preset on the page": {},
});

describe("React App", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000/");
  });

  it("should display help text", () => {
    Feature.trace("Add header text", () => {
      Feature.trace("Add welcome text");
      cy.get(".App-header p").should("contain", "save to reload.");
    });
  });

  it("should display entry point path", () => {
    Feature.trace("Path to App.js should be visible");
    cy.get(".App-header p > code").should("contain", "src/App.js");
  });

  describe("Graphics", () => {
    it("should display logo", () => {
      Feature.trace("SVG logo preset on the page");
      cy.get(".App-header .App-logo").should("exist");
    });
  });

  describe("Redirects", () => {
    it("should have a link with proper text", () => {
      Feature.trace('Link with text "Learn React"');
      cy.get("a.App-link").should("contain", "Learn React");
    });

    context("Links", () => {
      it("should have a react offsite link", () => {
        Feature.trace("Redirect to reactjs.org");
        cy.get(".App-link")
          .invoke("attr", "href")
          .should("eq", "https://reactjs.org");
      });
    });
  });
});
