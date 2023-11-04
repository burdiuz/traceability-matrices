import {
  createFeature,
  createEmptyFeatureState,
  registerFeature,
  wrapFeatureState,
} from "@actualwave/traceability-matrices/cypress";
import { load } from "js-yaml";

const renderStructure = (parentNode, structure = {}) => {
  if (!parentNode) {
    return structure;
  }

  if (parentNode instanceof Array) {
    parentNode.forEach((node) => {
      if (!node) {
        return;
      }

      if (typeof node === "object") {
        renderStructure(node, structure);
        return;
      }

      structure[String(node)] = {};
    });

    return structure;
  }

  if (typeof parentNode === "object") {
    Object.entries(parentNode).forEach(([key, node]) => {
      structure[key] = renderStructure(node);
    });
  }

  return structure;
};

/**
 * Parse YAML string and create a feature from it.
 * The structure of yaml file is following:
title: Feature Yaml
description: My feature description with <a href=\"https://google.com\">HTML</a>
group:
structure:
  Requirement 1: true
  Requirement 3: false
  Requirement 4: 1
  Categoy Name:
    - Requirement 4
  Categoy Name:
    Requirement 5: null
 *
 * @param {string} content String of YAML content
 * @returns
 */
export const parseYamlFeature = async (content) => {
  const doc = load(content);
  const feature = createEmptyFeatureState(doc);

  feature.structure = renderStructure(doc.structure);

  return feature;
};

/**
 * Since it uses cy.readFile(), it can be executed only within cypress hooks like before().
 *
 * @param {string} path Path to yaml file from feature root
 * @returns
 */
export const createFeatureFromYaml = (path) =>
  cy.readFile(path).then(
    (content) =>
      new Cypress.Promise((resolve, reject) => {
        parseYamlFeature(content)
          .then((state) => {
            registerFeature(state);
            const feature = wrapFeatureState(state);
            resolve(feature);
          })
          .catch(reject);
      })
  );

/**
 * It immediately returns empty feature and creates a before() hook which reads yaml file.
 * Once yaml has been read, its content(title, description, structure) merged
 * with returned feature.
 *
 * This way we don't need to wait for a promise or wrap it into lifecycle hooks.
 *
 * @param {string} path Path to yaml file from feature root
 * @returns FeatureApi
 */
export const createFeatureFromYamlAsync = (path) => {
  const feature = createFeature({
    title: "",
    description: "",
    group: "",
  });

  before(() => {
    cy.readFile(path).then(
      (content) =>
        new Cypress.Promise((resolve, reject) => {
          parseYamlFeature(content)
            .then((state) => {
              feature.structure().merge(state.structure);
              feature.headers(state.headers);
              feature.valueOf().title = state.title;
              feature.valueOf().description = state.description;
              feature.valueOf().group = state.group;
              resolve(feature);
            })
            .catch(reject);
        })
    );
  });

  return feature;
};
