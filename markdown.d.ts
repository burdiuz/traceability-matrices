import type { ProjectApi } from "./cypress";

/**
 * Parse markdown content string and create a prioject from it.
 * The structure of markdown file is following:
 * # Project title
 * Optional paragraph ormultiple paragraphs of project description, may contain links
 * 
 * ## Category
 * - list of requirements
 * 
 * @param {string} markdown String of markdown content
 */
export declare const parseMarkdownProject: (markdown: string) => ProjectApi;

/**
 * Since it uses cy.readFile(), it can be executed only within cypress hooks like before().
 *
 * @param {string} path Path to markdown file from project root
 */
export declare const createProjectFromMarkdown: (path: string) => {
  // Cypress.Chainable<ProjectApi>
  then: (callback: (project: ProjectApi) => void) => void;
};

/**
 * It immediately returns empty project and creates a before() hook which reads markdown file.
 * Once markdown has been read, its content(title, description, structure) merged
 * with returned project.
 *
 * This way we don't need to wait for a promise or wrap it into lifecycle hooks.
 *
 * @param {string} path Path to markdown file from project root
 */
export declare const createProjectFromMarkdownAsync: (path: string) => ProjectApi;
