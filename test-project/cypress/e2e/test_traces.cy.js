import { createProject } from "@actualwave/traceability-matrices/cypress";

const Project1 = createProject("Project A");
const Project2 = createProject("Project B");

describe("React App", () => {
  beforeEach(() => {
    Project1.trace("In before each");
    cy.visit("http://localhost:3000/");
  });

  it("should display help text", () => {
    Project1.trace("PRD Requirement 1");
    Project1.trace("PRD Requirement 2");
    Project1.trace("PRD Requirement 3", () => {
      Project1.trace("PRD Requirement 1");
      Project1.trace("PRD Requirement 2");

      cy.get(".App-header p").should("contain", "save to reload.");
    });
  });

  it("should display logo", () => {
    Project1.trace("PRD Requirement 1");
    Project1.trace("PRD Requirement 2");
    cy.get(".App-header .App-logo").should("exist");
  });

  it("should display help text", () => {
    Project1.trace("PRD Requirement 1");
    Project1.trace("PRD Requirement 2");
    Project1.trace("PRD Requirement 3", () => {
      Project1.trace("PRD Requirement 1");
      Project1.trace("PRD Requirement 2");

      cy.get(".App-header p").should("contain", "save to reload.");
      cy.get(".App-header p > code").should("contain", "src/App.js");
    });
  });

  describe("Redirects", () => {
    context("Links", () => {
      beforeEach(() => {
        Project2.trace("PRD Requirement BEFORE EACH");
      });

      before(() => {
        Project2.trace("PRD Requirement BEFORE");
      });

      after(() => {
        Project2.trace("PRD Requirement AFTER");
      });

      afterEach(() => {
        Project2.trace("PRD Requirement AFTER EACH");
      });

      it("should have a react offsite link", () => {
        Project2.trace("PRD Requirement A", () => {
          Project2.trace("PRD Requirement A");
          Project2.trace("PRD Requirement B", () => {
            Project2.trace("PRD Requirement A");
            Project2.trace("PRD Requirement C");

            cy.get(".App-link")
              .invoke("attr", "href")
              .should("eq", "https://reactjs.org");
          });
        });

        Project1.trace("PRD Requirement 4", () => {
          Project1.trace("PRD Requirement 1");
          Project1.trace("PRD Requirement 3");
          Project1.trace("PRD Requirement 5");

          cy.get(".App-link").should("contain", "Learn React");
        });
      });
    });
  });
});
