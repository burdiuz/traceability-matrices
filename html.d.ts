import type { FeatureApi } from "./cypress";

/**
 * Parse html content string and create a feature from it.
 * The structure of html file is following:
 * # Feature title
 * Optional paragraph or multiple paragraphs of feature description, may contain links
 * 
 * ## Category
 * - list of requirements
 * 
 * @param {string} html String of html content
 */
export declare const parseHtmlFeature: (html: string) => FeatureApi;

/**
 * Since it uses cy.readFile(), it can be executed only within cypress hooks like before().
 *
 * @param {string} path Path to html file from feature root
 */
export declare const createFeatureFromHtml: (path: string) => {
  // Cypress.Chainable<FeatureApi>
  then: (callback: (FeatureApi: FeatureApi) => void) => void;
};

/**
 * It immediately returns empty feature and creates a before() hook which reads html file.
 * Once html has been read, its content(title, description, structure) merged
 * with returned feature.
 *
 * This way we don't need to wait for a promise or wrap it into lifecycle hooks.
 *
 * @param {string} path Path to html file from feature root
 */
export declare const createFeatureFromHtmlAsync: (path: string) => FeatureApi;
