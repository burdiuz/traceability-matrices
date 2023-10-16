import type { FeatureApi } from "./cypress";

/**
 * Parse yaml content string and create a feature from it.
 * The structure of yaml file is following:
 * # Feature title
 * Optional paragraph or multiple paragraphs of feature description, may contain links
 * 
 * ## Category
 * - list of requirements
 * 
 * @param {string} yaml String of yaml content
 */
export declare const parseYamlFeature: (yaml: string) => FeatureApi;

/**
 * Since it uses cy.readFile(), it can be executed only within cypress hooks like before().
 *
 * @param {string} path Path to yaml file from feature root
 */
export declare const createFeatureFromYaml: (path: string) => {
  // Cypress.Chainable<FeatureApi>
  then: (callback: (FeatureApi: FeatureApi) => void) => void;
};

/**
 * It immediately returns empty feature and creates a before() hook which reads yaml file.
 * Once yaml has been read, its content(title, description, structure) merged
 * with returned feature.
 *
 * This way we don't need to wait for a promise or wrap it into lifecycle hooks.
 *
 * @param {string} path Path to yaml file from feature root
 */
export declare const createFeatureFromYamlAsync: (path: string) => FeatureApi;
