import { createFeature } from "@actualwave/traceability-matrices/cypress";

const Feature1 = createFeature("Feature A");
const Feature2 = createFeature("Feature B");

describe("React App", () => {
  beforeEach(() => {
    Feature1.trace("In before each");
    cy.visit("http://localhost:3000/");
  });

  it("should display help text", () => {
    Feature1.trace("PRD Requirement 1");
    Feature1.trace("PRD Requirement 2");
    Feature1.trace("PRD Requirement 3", () => {
      Feature1.trace("PRD Requirement 1");
      Feature1.trace("PRD Requirement 2");

      cy.get(".App-header p").should("contain", "save to reload.");
    });
  });

  it("should display logo", () => {
    Feature1.trace("PRD Requirement 1");
    Feature1.trace("PRD Requirement 2");
    cy.get(".App-header .App-logo").should("exist");
  });

  it("should display help text", () => {
    Feature1.trace("PRD Requirement 1");
    Feature1.trace("PRD Requirement 2");
    Feature1.trace("PRD Requirement 3", () => {
      Feature1.trace("PRD Requirement 1");
      Feature1.trace("PRD Requirement 2");

      cy.get(".App-header p").should("contain", "save to reload.");
      cy.get(".App-header p > code").should("contain", "src/App.js");
    });
  });

  describe("Redirects", () => {
    context("Links", () => {
      beforeEach(() => {
        Feature2.trace("PRD Requirement BEFORE EACH");
      });

      before(() => {
        Feature2.trace("PRD Requirement BEFORE");
      });

      after(() => {
        Feature2.trace("PRD Requirement AFTER");
      });

      afterEach(() => {
        Feature2.trace("PRD Requirement AFTER EACH");
      });

      it("should have a react offsite link", () => {
        Feature2.trace("PRD Requirement A", () => {
          Feature2.trace("PRD Requirement A");
          Feature2.trace("PRD Requirement B", () => {
            Feature2.trace("PRD Requirement A");
            Feature2.trace("PRD Requirement C");

            cy.get(".App-link")
              .invoke("attr", "href")
              .should("eq", "https://reactjs.org");
          });
        });

        Feature1.trace("PRD Requirement 4", () => {
          Feature1.trace("PRD Requirement 1");
          Feature1.trace("PRD Requirement 3");
          Feature1.trace("PRD Requirement 5");

          cy.get(".App-link").should("contain", "Learn React");
        });
      });
    });
  });
});
