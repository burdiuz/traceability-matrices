import type { ProjectApi } from "./cypress";

export declare const parseMarkdownProject: (markdown: string) => ProjectApi;

export declare const createProjectFromMarkdown: (markdown: string) => {
  // Cypress.Chainable<ProjectApi>
  then: (callback: (project: ProjectApi) => void) => void;
};
