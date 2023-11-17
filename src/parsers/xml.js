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

const createCategory = (parentNode, structure = {}) => {
  if (parentNode?.nodeType !== 1) {
    return;
  }

  let name = "";
  parentNode.childNodes.forEach((node) => {
    if (node.nodeType !== 1) {
      return;
    }

    switch (node.tagName.toLowerCase()) {
      case "category":
        {
          const [name, children] = createCategory(node);
          structure[name] = children;
        }
        break;
      case "name":
        {
          name = getNodeContent(node);
        }
        break;
      case "requirement":
        {
          structure[getNodeContent(node)] = {};
        }
        break;
    }
  });

  return [name, structure];
};

/**
 * Parse xml string and create a feature from it.
 * The structure of xml file is following:
 * <feature>
 *   <title>Feature title</title>
 *   <description>Feature description</description>
 *   <group>Feature group</group>
 *   <requirement>Requirement name</requirement>
 *   <category>
 *     <name>Category name</name>
 *     <requirement>Requirment name</requirement>
 *   </category>
 * </feature>
 *
 * @param {string} content String of XML content
 * @returns
 */
export const parseXmlFeature = async (content) => {
  const dom = parse(content);
  const rootNode = dom.querySelector("feature");
  const titleNode = dom.querySelector("feature > title");
  const descriptionNode = dom.querySelector("feature > description");
  const groupNode = dom.querySelector("feature > group");
  const feature = createEmptyFeatureState({
    title: getNodeContent(titleNode),
    group: getNodeContent(groupNode),
    description: getNodeContent(descriptionNode),
  });

  const [, structure] = createCategory(rootNode);
  feature.structure = structure;

  return feature;
};

/**
 * Since it uses cy.readFile(), it can be executed only within cypress hooks like before().
 *
 * @param {string} path Path to xml file from feature root
 * @returns
 */
export const createFeatureFromXml = (path) =>
  cy.readFile(path).then(
    (content) =>
      new Cypress.Promise((resolve, reject) => {
        parseXmlFeature(content)
          .then((state) => {
            registerFeature(state);
            const feature = wrapFeatureState(state);
            resolve(feature);
          })
          .catch(reject);
      })
  );

/**
 * It immediately returns empty feature and creates a before() hook which reads xml file.
 * Once xml has been read, its content(title, description, structure) merged
 * with returned feature.
 *
 * This way we don't need to wait for a promise or wrap it into lifecycle hooks.
 *
 * @param {string} path Path to xml file from feature root
 * @returns FeatureApi
 */
export const createFeatureFromXmlAsync = (path) => {
  const feature = createFeature({
    title: "",
    description: "",
    group: "",
  });

  before(() => {
    cy.readFile(path).then(
      (content) =>
        new Cypress.Promise((resolve, reject) => {
          parseXmlFeature(content)
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
