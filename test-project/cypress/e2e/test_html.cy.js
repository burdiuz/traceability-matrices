import { createFeature } from "@actualwave/traceability-matrices/cypress";
import {
  createFeatureFromHtml,
  createFeatureFromHtmlAsync,
} from "@actualwave/traceability-matrices/html";

const Feature2 = createFeature({ title: "Feature B" });
/*
  When loading html asynchronously project structure is not available immediately, 
  until test starts it will be empty.
*/
const FeatureHtml = createFeatureFromHtmlAsync(
  "cypress/features/FeatureHtml.html"
);

describe("React App", () => {
  /*
  The other way to create project from html is to wait for Html parser

  let FeatureHtml;

  before(() => {
    createFeatureFromHtml("cypress/projects/FeatureHtml.html").then((project) => {
      FeatureHtml = project;
    });
  });
  */

  beforeEach(() => {
    FeatureHtml.trace("In before each");
    cy.visit("http://localhost:3000/");
  });

  it("should display help text", () => {
    FeatureHtml.trace("PRD Requirement 1");
    FeatureHtml.trace("PRD Requirement 2");
    FeatureHtml.trace("PRD Requirement 3", () => {
      FeatureHtml.trace("PRD Requirement 1");
      FeatureHtml.trace("PRD Requirement 2");

      cy.get(".App-header p").should("contain", "save to reload.");
    });
  });

  it("should display logo", () => {
    FeatureHtml.trace("PRD Requirement 1");
    FeatureHtml.trace("PRD Requirement 2");
    cy.get(".App-header .App-logo").should("exist");
  });

  it("should display help text", () => {
    FeatureHtml.trace("PRD Requirement 1");
    FeatureHtml.trace("PRD Requirement 2");
    FeatureHtml.trace("PRD Requirement 3", () => {
      FeatureHtml.trace("PRD Requirement 1");
      FeatureHtml.trace("PRD Requirement 2");

      cy.get(".App-header p").should("contain", "save to reload.");
      cy.get(".App-header p > code").should("contain", "src/App.js");
    });
  });

  describe("Redirects", () => {
    context("Links", () => {
      beforeEach(() => {
        Feature2.trace("PRD Requirement BEFORE EACH");
        FeatureHtml.trace("Requirement on a side with & \" ' entities 1");
      });

      before(() => {
        Feature2.trace("PRD Requirement BEFORE");
      });

      after(() => {
        Feature2.trace("PRD Requirement AFTER");
        FeatureHtml.trace("Requirement with & \" ' < > entities 7");
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

        FeatureHtml.trace("PRD Requirement 4", () => {
          FeatureHtml.trace("PRD Requirement 1");
          FeatureHtml.trace("PRD Requirement 3");
          FeatureHtml.trace("PRD Requirement 5");

          cy.get(".App-link").should("contain", "Learn React");
        });
      });
    });
  });
});
