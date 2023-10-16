import { createFeature } from "@actualwave/traceability-matrices/cypress";

const Feature = createFeature({ title: "Feature C" });

describe("React App", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000/");
  });

  Feature.requirement("Statics", "Add header text").it(
    "should display help text",
    () => {
      Feature.trace(["Statics", "Add welcome text"]);
      cy.get(".App-header p").should("contain", "save to reload.");
    }
  );

  Feature.requirement("Statics", "Path to App.js should be visible").it(
    "should display entry point path",
    () => {
      cy.get(".App-header p > code").should("contain", "src/App.js");
    }
  );

  describe("Graphics", () => {
    Feature.requirement("SVG logo preset on the page").it(
      "should display logo",
      () => {
        cy.get(".App-header .App-logo").should("exist");
      }
    );
  });

  describe("Redirects", () => {
    Feature.requirement(
      "Interactive",
      "Redirects",
      'Link with text "Learn React"'
    ).it("should have a link with proper text", () => {
      cy.get("a.App-link").should("contain", "Learn React");
    });

    context("Links", () => {
      Feature.requirement(
        "Interactive",
        "Redirects",
        "High Priority",
        "Redirect to reactjs.org"
      ).it("should have a react offsite link", () => {
        cy.get(".App-link")
          .invoke("attr", "href")
          .should("eq", "https://reactjs.org");
      });
    });
  });
});
