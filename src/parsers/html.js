import {
  createFeature,
  createEmptyFeatureState,
  registerFeature,
  wrapFeatureState,
} from "@actualwave/traceability-matrices/cypress";
import { parse } from "node-html-parser";

const getNodeContent = (node) => {
  if (!node) {
    return "";
  }

  const hasElements = !!node.childNodes.find(({ nodeType }) => nodeType === 1);

  return hasElements ? node.innerHTML.trim() : node.textContent.trim();
};

const buildStructureFromHtmlNodes = (node, parent = {}) => {
  node.childNodes.forEach((child) => {
    if (child.nodeType !== 1) {
      return;
    }

    if (child.hasAttribute("data-feature-category")) {
      const category = {};
      parent[child.getAttribute("data-feature-category")] = category;
      buildStructureFromHtmlNodes(child, category);
    } else if (child.hasAttribute("data-feature-requirement")) {
      parent[child.getAttribute("data-feature-requirement")] = {};
    } else {
      buildStructureFromHtmlNodes(child, parent);
    }
  });

  return parent;
};

/**
 * Parse html string and create a feature from it. It looks for data attributes
 * data-feature-title - Feature title.
 * data-feature-group - Feature group, must be placed on same element as title.
 * data-feature-description - Feature description, if attribute does not have value, element contents will be taken.
 * data-feature-category - Structure category.
 * data-feature-requirement - Structure requirement.
 * 
 * The structure of html file could be like this:
 * <div data-feature-title="Feature title" data-feature-group="Feature group">
 *   <p data-feature-description>Feature description</p>
 *   <span data-feature-requirement="Requirement name">Requirement name</span>
 *   <ul data-feature-category="Category name">
 *     <li data-feature-requirement="Requirment name">Requirment name</li>
 *   </ul>
 * </div>
 *
 * @param {string} content String of HTML content
 * @returns
 */
export const parseHtmlFeature = async (content) => {
  const dom = parse(content);
  const titleNode = dom.querySelector("[data-feature-title]");
  const descriptionNode = dom.querySelector("[data-feature-description]");
  const feature = createEmptyFeatureState({
    title: titleNode.getAttribute("data-feature-title"),
    group: titleNode.getAttribute("data-feature-group") || "",
    description:
      descriptionNode?.getAttribute("data-feature-description") ||
      getNodeContent(descriptionNode),
  });

  feature.structure = buildStructureFromHtmlNodes(dom);

  return feature;
};

/**
 * Since it uses cy.readFile(), it can be executed only within cypress hooks like before().
 *
 * @param {string} path Path to html file from feature root
 * @returns
 */
export const createFeatureFromHtml = (path) =>
  cy.readFile(path).then(
    (content) =>
      new Cypress.Promise((resolve, reject) => {
        parseHtmlFeature(content)
          .then((state) => {
            registerFeature(state);
            const feature = wrapFeatureState(state);
            resolve(feature);
          })
          .catch(reject);
      })
  );

/**
 * It immediately returns empty feature and creates a before() hook which reads html file.
 * Once html has been read, its content(title, description, structure) merged
 * with returned feature.
 *
 * This way we don't need to wait for a promise or wrap it into lifecycle hooks.
 *
 * @param {string} path Path to html file from feature root
 * @returns FeatureApi
 */
export const createFeatureFromHtmlAsync = (path) => {
  const feature = createFeature({
    title: "",
    description: "",
    group: "",
  });

  before(() => {
    cy.readFile(path).then(
      (content) =>
        new Cypress.Promise((resolve, reject) => {
          parseHtmlFeature(content)
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
