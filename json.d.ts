import type { FeatureApi } from "./cypress";

/**
 * Parse json content string and create a feature from it.
 * The structure of json file is following:
 * # Feature title
 * Optional paragraph or multiple paragraphs of feature description, may contain links
 * 
 * ## Category
 * - list of requirements
 * 
 * @param {string} json Object or string of json content
 */
export declare const parseJsonFeature: (json: string) => FeatureApi;

/**
 * Since it uses cy.readFile(), it can be executed only within cypress hooks like before().
 *
 * @param {string} path Path to json file from feature root
 */
export declare const createFeatureFromJson: (path: string) => {
  // Cypress.Chainable<FeatureApi>
  then: (callback: (FeatureApi: FeatureApi) => void) => void;
};

/**
 * It immediately returns empty feature and creates a before() hook which reads json file.
 * Once json has been read, its content(title, description, structure) merged
 * with returned feature.
 *
 * This way we don't need to wait for a promise or wrap it into lifecycle hooks.
 *
 * @param {string} path Path to json file from feature root
 */
export declare const createFeatureFromJsonAsync: (path: string) => FeatureApi;
