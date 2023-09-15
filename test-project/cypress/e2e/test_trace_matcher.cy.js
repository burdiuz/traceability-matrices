import { createProject } from "@actualwave/traceability-matrices/cypress";

const Project = createProject("Project Matcher");

Project.structure({
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

Project.setTraceToRequirementMatcher((name, requirements) => {
  const req = Object.keys(requirements).find((key) => key.indexOf(name) === 0);

  return req || name;
});

describe("React App", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000/");
  });

  it("should display help text", () => {
    Project.trace("S001", () => {
      Project.trace("S003");

      cy.get(".App-header p").should("contain", "save to reload.");
    });
  });

  it("should display entry point path", () => {
    Project.trace("S002");

    cy.get(".App-header p > code").should("contain", "src/App.js");
  });

  describe("Graphics", () => {
    it("should display logo", () => {
      Project.trace("001");

      cy.get(".App-header .App-logo").should("exist");
    });
  });

  describe("Redirects", () => {
    it("should have a link with proper text", () => {
      Project.trace("IR001");

      cy.get("a.App-link").should("contain", "Learn React");
    });

    context("Links", () => {
      it("should have a react offsite link", () => {
        Project.trace("IRH001");

        cy.get(".App-link")
          .invoke("attr", "href")
          .should("eq", "https://reactjs.org");
      });
    });
  });
});
