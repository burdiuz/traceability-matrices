import {
  createProject,
  createEmptyProjectState,
  registerProject,
  wrapProjectState,
} from "@actualwave/traceability-matrices/cypress";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkHtml from "remark-html";

const isStructurePart = ({ type }, types = ["heading", "list"]) =>
  types.includes(type);

const unpack = (item) => {
  if (["heading", "listItem", "paragraph"].includes(item.type)) {
    return item.children.length === 1
      ? unpack(item.children[0])
      : item.children;
  }

  return [item];
};

const splitItems = (list, types = undefined) => {
  const firstStructIndex = list.findIndex((item) =>
    isStructurePart(item, types)
  );
  if (firstStructIndex < 0) {
    return [list, []];
  }

  return [list.slice(0, firstStructIndex), list.slice(firstStructIndex)];
};

const createRoot = (
  children = [],
  end = { line: 1, column: 1, offset: 0 }
) => ({
  type: "root",
  children,
  position: {
    start: { line: 1, column: 1, offset: 0 },
    end,
  },
});

const toHtml = (list) =>
  unified().use(remarkHtml).stringify(createRoot(list)).trim();

const collectData = async (list, parent, ancestors) => {
  if (!list.length) {
    return;
  }

  const item = list.shift();

  switch (item.type) {
    case "heading":
      {
        const [nameNodes, children] = splitItems(list);
        const name = await toHtml([...item.children, ...nameNodes]);
        ancestors = ancestors.slice(0, item.depth - 1);

        // 1st level title is a title of the project, structure starts with 2nd level
        parent = ancestors[item.depth - 2];

        if (!(name in parent)) {
          parent[name] = {};
        }

        await collectData(children, parent[name], [...ancestors, parent[name]]);
      }
      break;
    case "list":
      {
        for (let index = 0; index < item.children.length; index++) {
          const child = item.children[index];

          if (child.type !== "listItem") {
            continue;
          }

          // within list items, headings are normal nodes and not treated as sub-categories
          const [nameNodes, children] = splitItems(child.children, ["list"]);
          const name = await toHtml(
            nameNodes.length === 1 ? unpack(nameNodes[0]) : nameNodes
          );

          if (!(name in parent)) {
            parent[name] = {};
          }

          await collectData(children, parent[name], [
            ...ancestors,
            parent[name],
          ]);
        }

        await collectData(list, parent, ancestors);
      }
      break;
  }
};

/**
 * Parse markdown content string and create a prioject from it.
 * The structure of markdown file is following:
 * # Project title
 * Optional paragraph ormultiple paragraphs of project description, may contain links
 *
 * ## Category
 * - list of requirements
 *
 * @param {string} content String of markdown content
 * @returns
 */
export const parseMarkdownProject = async (content) => {
  const result = await unified().use(remarkParse).parse(content).children;

  const project = createEmptyProjectState("");

  if (result[0].type === "heading" || result[0].type === "paragraph") {
    project.title = await toHtml(result.shift().children);
  }

  const [description, struct] = splitItems(result);
  project.description = await toHtml(description);

  await collectData(struct, project.structure, [project.structure]);

  return project;
};

/**
 * Since it uses cy.readFile(), it can be executed only within cypress hooks like before().
 *
 * @param {string} path Path to markdown file from project root
 * @returns
 */
export const createProjectFromMarkdown = (path) =>
  cy.readFile(path).then(
    (content) =>
      new Cypress.Promise((resolve, reject) => {
        parseMarkdownProject(content)
          .then((state) => {
            registerProject(state);
            const project = wrapProjectState(state);
            resolve(project);
          })
          .catch(reject);
      })
  );

/**
 * It immediately returns empty project and creates a before() hook which reads markdown file.
 * Once markdown has been read, its content(title, description, structure) merged
 * with returned project.
 *
 * This way we don't need to wait for a promise or wrap it into lifecycle hooks.
 *
 * @param {string} path Path to markdown file from project root
 * @returns ProjectApi
 */
export const createProjectFromMarkdownAsync = (path) => {
  const project = createProject("");

  before(() => {
    cy.readFile(path).then(
      (content) =>
        new Cypress.Promise((resolve, reject) => {
          parseMarkdownProject(content)
            .then((state) => {
              project.structure().merge(state.structure);
              project.headers(state.headers);
              project.valueOf().title = state.title;
              project.valueOf().description = state.description;
            })
            .catch(reject);
        })
    );
  });

  return project;
};
