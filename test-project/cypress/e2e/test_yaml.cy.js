import { createFeature } from "@actualwave/traceability-matrices/cypress";
import {
  createFeatureFromYaml,
  createFeatureFromYamlAsync,
} from "@actualwave/traceability-matrices/yaml";

const Feature2 = createFeature({ title: "Feature B" });
/*
  When loading yaml asynchronously project structure is not available immediately, 
  until test starts it will be empty.
*/
const FeatureYaml = createFeatureFromYamlAsync(
  "cypress/features/FeatureYaml.yaml"
);

describe("React App", () => {
  /*
  The other way to create project from yaml is to wait for Yaml parser

  let FeatureYaml;

  before(() => {
    createFeatureFromYaml("cypress/projects/FeatureYaml.yaml").then((project) => {
      FeatureYaml = project;
    });
  });
  */

  beforeEach(() => {
    FeatureYaml.trace("In before each");
    cy.visit("http://localhost:3000/");
  });

  it("should display help text", () => {
    FeatureYaml.trace("PRD Requirement 1");
    FeatureYaml.trace("PRD Requirement 2");
    FeatureYaml.trace("PRD Requirement 3", () => {
      FeatureYaml.trace("PRD Requirement 1");
      FeatureYaml.trace("PRD Requirement 2");

      cy.get(".App-header p").should("contain", "save to reload.");
    });
  });

  it("should display logo", () => {
    FeatureYaml.trace("PRD Requirement 1");
    FeatureYaml.trace("PRD Requirement 2");
    cy.get(".App-header .App-logo").should("exist");
  });

  it("should display help text", () => {
    FeatureYaml.trace("PRD Requirement 1");
    FeatureYaml.trace("PRD Requirement 2");
    FeatureYaml.trace("PRD Requirement 3", () => {
      FeatureYaml.trace("PRD Requirement 1");
      FeatureYaml.trace("PRD Requirement 2");

      cy.get(".App-header p").should("contain", "save to reload.");
      cy.get(".App-header p > code").should("contain", "src/App.js");
    });
  });

  describe("Redirects", () => {
    context("Links", () => {
      beforeEach(() => {
        Feature2.trace("PRD Requirement BEFORE EACH");
        FeatureYaml.trace("Requirement on a side with & \" ' entities 1");
      });

      before(() => {
        Feature2.trace("PRD Requirement BEFORE");
      });

      after(() => {
        Feature2.trace("PRD Requirement AFTER");
        FeatureYaml.trace("Requirement with & \" ' < > entities 7");
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

        FeatureYaml.trace("PRD Requirement 4", () => {
          FeatureYaml.trace("PRD Requirement 1");
          FeatureYaml.trace("PRD Requirement 3");
          FeatureYaml.trace("PRD Requirement 5");

          cy.get(".App-link").should("contain", "Learn React");
        });
      });
    });
  });
});
