import {
  createFeature,
  createEmptyFeatureState,
  registerFeature,
  wrapFeatureState,
} from "@actualwave/traceability-matrices/cypress";

// somehow "node instanceof Array" may give FALSE for parsed arrays
const isArray = (item) =>
  item &&
  typeof item === "object" &&
  (item instanceof Array ||
    ("length" in item && typeof item.sort === "function"));

const renderInnerArray = (parentNode, structure) => {
  parentNode.forEach((node) => {
    if (!node) {
      return;
    }

    if (typeof node === "object") {
      if (isArray(node)) {
        renderInnerArray(node, structure);
      } else {
        renderStructure(node, structure);
      }
      return;
    }

    structure[String(node)] = {};
  });
};

const renderStructure = (parentNode, structure = {}) => {
  if (!parentNode) {
    return structure;
  }

  if (isArray(parentNode)) {
    renderInnerArray(parentNode, structure);
    return structure;
  }

  if (typeof parentNode === "object") {
    Object.entries(parentNode).forEach(([key, node]) => {
      if (node && typeof node === "object") {
        structure[key] = renderStructure(node);
      } else {
        structure[String(node)] = {};
      }
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
export const parseJsonFeature = async (content) => {
  // Cypress automatically parses JSON files
  const doc = typeof content === "string" ? JSON.parse(content) : content;
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
export const createFeatureFromJson = (path) =>
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
export const createFeatureFromJsonAsync = (path) => {
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
              feature.valueOf().group = state.group;
              resolve(feature);
            })
            .catch(reject);
        })
    );
  });

  return feature;
};
