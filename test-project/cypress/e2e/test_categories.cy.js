import { createFeature } from "@actualwave/traceability-matrices/cypress";

const Feature = createFeature("Feature C");

Feature.structure({
  "Category A": {
    "Requirement A": {},
    "Requirement B": {},
    "Requirement C": {},
    "Requirement D": {},
    "Requirement E": {},
    "Requirement F": {},
  },
  "Category B": {
    "Category B1": {
      "Category B11": {
        "Requirement B11 A": {},
        "Requirement A": {},
        "Requirement B": {},
        "Requirement C": {},
        "Requirement J": {},
        "Requirement K": {},
        "Requirement L": {},
      },
    },
  },
  "Category C": {
    "Requirement G": {},
    "Requirement H": {},
    "Requirement I": {},
    "Requirement D": {},
    "Requirement E": {},
    "Requirement F": {},
  },
});

describe("React App", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000/");
  });

  Feature.requirement("Category A", "Requirement F").it(
    "should display help text",
    () => {
      Feature.trace([
        "Category B",
        "Category B1",
        "Category B11",
        "Requirement B11 A",
      ]);
      cy.get(".App-header p").should("contain", "save to reload.");
    }
  );

  Feature.category("Category A")
    .requirement("Requirement F")
    .it("should display entry point path", () => {
      cy.get(".App-header p > code").should("contain", "src/App.js");
    });

  describe("Graphics", () => {
    it("should display logo", () => {
      Feature.category("Category A").trace("Requirement C");
      cy.get(".App-header .App-logo").should("exist");
    });
  });

  describe("Redirects", () => {
    it("should have a link with proper text", () => {
      Feature.category("Category B", "Category B1", "Category B11").trace(
        "Requirement A"
      );
      cy.get("a.App-link").should("contain", "Learn React");
    });

    context("Links", () => {
      Feature.category("Category C")
        .requirement("Requirement F")
        .it("should have a react offsite link", () => {
          cy.get(".App-link")
            .invoke("attr", "href")
            .should("eq", "https://reactjs.org");
        });
    });
  });
});
