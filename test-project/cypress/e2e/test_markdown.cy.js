import { createFeature } from "@actualwave/traceability-matrices/cypress";
import {
  createFeatureFromMarkdown,
  createFeatureFromMarkdownAsync,
} from "@actualwave/traceability-matrices/markdown";

const Feature2 = createFeature("Feature B");
/*
  When loading markdown asynchronously project structure is not available immediately, 
  until test starts it will be empty.
*/
const FeatureMarkdown = createFeatureFromMarkdownAsync(
  "cypress/features/FeatureMarkdown.md"
);

describe("React App", () => {
  /*
  The other way to create project from markdown is to wait for Markdown parser

  let FeatureMarkdown;

  before(() => {
    createFeatureFromMarkdown("cypress/projects/FeatureMarkdown.md").then((project) => {
      FeatureMarkdown = project;
    });
  });
  */

  beforeEach(() => {
    FeatureMarkdown.trace("In before each");
    cy.visit("http://localhost:3000/");
  });

  it("should display help text", () => {
    FeatureMarkdown.trace("PRD Requirement 1");
    FeatureMarkdown.trace("PRD Requirement 2");
    FeatureMarkdown.trace("PRD Requirement 3", () => {
      FeatureMarkdown.trace("PRD Requirement 1");
      FeatureMarkdown.trace("PRD Requirement 2");

      cy.get(".App-header p").should("contain", "save to reload.");
    });
  });

  it("should display logo", () => {
    FeatureMarkdown.trace("PRD Requirement 1");
    FeatureMarkdown.trace("PRD Requirement 2");
    cy.get(".App-header .App-logo").should("exist");
  });

  it("should display help text", () => {
    FeatureMarkdown.trace("PRD Requirement 1");
    FeatureMarkdown.trace("PRD Requirement 2");
    FeatureMarkdown.trace("PRD Requirement 3", () => {
      FeatureMarkdown.trace("PRD Requirement 1");
      FeatureMarkdown.trace("PRD Requirement 2");

      cy.get(".App-header p").should("contain", "save to reload.");
      cy.get(".App-header p > code").should("contain", "src/App.js");
    });
  });

  describe("Redirects", () => {
    context("Links", () => {
      beforeEach(() => {
        Feature2.trace("PRD Requirement BEFORE EACH");
        FeatureMarkdown.trace("Requirement on a side with & \" ' entities 1");
      });

      before(() => {
        Feature2.trace("PRD Requirement BEFORE");
      });

      after(() => {
        Feature2.trace("PRD Requirement AFTER");
        FeatureMarkdown.trace("Requirement with & \" ' < > entities 7");
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

        FeatureMarkdown.trace("PRD Requirement 4", () => {
          FeatureMarkdown.trace("PRD Requirement 1");
          FeatureMarkdown.trace("PRD Requirement 3");
          FeatureMarkdown.trace("PRD Requirement 5");

          cy.get(".App-link").should("contain", "Learn React");
        });
      });
    });
  });
});
