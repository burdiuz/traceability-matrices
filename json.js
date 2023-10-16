import { createEmptyFeatureState, registerFeature, wrapFeatureState, createFeature } from '@actualwave/traceability-matrices/cypress';

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
 * Parse JSON string and create a feature from it.
 * The structure of json file is following:
 * {
 *   "title": "Feature title",
 *   "description": "Optional feature description",
 *   "group": "Optional feature group",
 *   "structure": {
 *     "Requirement name": {},
 *     "Requirement name": null,
 *     "Requirement name": '',
 *     "Category name": {
 *       "Requirement name": {},
 *       "Category name": {
 *         "Requirement name": {}
 *       }
 *     }
 *   }
 * }
 *
 * @param {string} content String of JSON content
 * @returns
 */
const parseJsonFeature = async (content) => {
  const doc = JSON.parse(content);
  const feature = createEmptyFeatureState(doc);

  feature.structure = renderStructure(doc.structure);

  return feature;
};

/**
 * Since it uses cy.readFile(), it can be executed only within cypress hooks like before().
 *
 * @param {string} path Path to json file from feature root
 * @returns
 */
const createFeatureFromJson = (path) =>
  cy.readFile(path).then(
    (content) =>
      new Cypress.Promise((resolve, reject) => {
        parseJsonFeature(content)
          .then((state) => {
            registerFeature(state);
            const feature = wrapFeatureState(state);
            resolve(feature);
          })
          .catch(reject);
      })
  );

/**
 * It immediately returns empty feature and creates a before() hook which reads json file.
 * Once json has been read, its content(title, description, structure) merged
 * with returned feature.
 *
 * This way we don't need to wait for a promise or wrap it into lifecycle hooks.
 *
 * @param {string} path Path to json file from feature root
 * @returns FeatureApi
 */
const createFeatureFromJsonAsync = (path) => {
  const feature = createFeature({
    title: "",
    description: "",
    group: "",
  });

  before(() => {
    cy.readFile(path).then(
      (content) =>
        new Cypress.Promise((resolve, reject) => {
          parseJsonFeature(content)
            .then((state) => {
              feature.structure().merge(state.structure);
              feature.headers(state.headers);
              feature.valueOf().title = state.title;
              feature.valueOf().description = state.description;
              resolve(feature);
            })
            .catch(reject);
        })
    );
  });

  return feature;
};

export { createFeatureFromJson, createFeatureFromJsonAsync, parseJsonFeature };
