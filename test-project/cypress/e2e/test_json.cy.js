import { createFeature } from "@actualwave/traceability-matrices/cypress";
import {
  createFeatureFromJson,
  createFeatureFromJsonAsync,
} from "@actualwave/traceability-matrices/json";

const Feature2 = createFeature({ title: "Feature B" });
/*
  When loading json asynchronously project structure is not available immediately, 
  until test starts it will be empty.
*/
const FeatureJson = createFeatureFromJsonAsync(
  "cypress/features/FeatureJson.json"
);

describe("React App", () => {
  /*
  The other way to create project from json is to wait for Json parser

  let FeatureJson;

  before(() => {
    createFeatureFromJson("cypress/projects/FeatureJson.json").then((project) => {
      FeatureJson = project;
    });
  });
  */

  beforeEach(() => {
    FeatureJson.trace("In before each");
    cy.visit("http://localhost:3000/");
  });

  it("should display help text", () => {
    FeatureJson.trace("PRD Requirement 1");
    FeatureJson.trace("PRD Requirement 2");
    FeatureJson.trace("PRD Requirement 3", () => {
      FeatureJson.trace("PRD Requirement 1");
      FeatureJson.trace("PRD Requirement 2");

      cy.get(".App-header p").should("contain", "save to reload.");
    });
  });

  it("should display logo", () => {
    FeatureJson.trace("PRD Requirement 1");
    FeatureJson.trace("PRD Requirement 2");
    cy.get(".App-header .App-logo").should("exist");
  });

  it("should display help text", () => {
    FeatureJson.trace("PRD Requirement 1");
    FeatureJson.trace("PRD Requirement 2");
    FeatureJson.trace("PRD Requirement 3", () => {
      FeatureJson.trace("PRD Requirement 1");
      FeatureJson.trace("PRD Requirement 2");

      cy.get(".App-header p").should("contain", "save to reload.");
      cy.get(".App-header p > code").should("contain", "src/App.js");
    });
  });

  describe("Redirects", () => {
    context("Links", () => {
      beforeEach(() => {
        Feature2.trace("PRD Requirement BEFORE EACH");
        FeatureJson.trace("Requirement on a side with & \" ' entities 1");
      });

      before(() => {
        Feature2.trace("PRD Requirement BEFORE");
      });

      after(() => {
        Feature2.trace("PRD Requirement AFTER");
        FeatureJson.trace("Requirement with & \" ' < > entities 7");
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

        FeatureJson.trace("PRD Requirement 4", () => {
          FeatureJson.trace("PRD Requirement 1");
          FeatureJson.trace("PRD Requirement 3");
          FeatureJson.trace("PRD Requirement 5");

          cy.get(".App-link").should("contain", "Learn React");
        });
      });
    });
  });
});
