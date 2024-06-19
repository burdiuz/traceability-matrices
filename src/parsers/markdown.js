import {
  createFeature,
  createEmptyFeatureState,
  registerFeature,
  wrapFeatureState,
} from "./cypress";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkHtml from "remark-html";
import { parseEntities } from "parse-entities";

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

const isHtml = (string) => /<[a-z][^>]+>/i.test(string);

const toHtml = (list) => {
  const string = unified().use(remarkHtml).stringify(createRoot(list)).trim();

  if (!isHtml(string)) {
    // String does not contain any tags and we should convert HTML entities back to normal
    // this way user can use normal symbol in trace instead of using HTML entities
    return parseEntities(string);
  }

  return string;
};

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

        // 1st level title is a title of the feature, structure starts with 2nd level
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
 * Parse markdown content string and create a feature from it.
 * The structure of markdown file is following:
 * # Feature title
 * Optional paragraph or multiple paragraphs of feature description, may contain links
 *
 * ## Category
 * - list of requirements
 *
 * @param {string} content String of markdown content
 * @returns
 */
export const parseMarkdownFeature = async (content) => {
  const result = await unified().use(remarkParse).parse(content).children;

  const feature = createEmptyFeatureState({
    title: "",
    description: "",
    group: "",
  });

  if (result[0].type === "heading" || result[0].type === "paragraph") {
    let group = "";
    let title = await toHtml(result.shift().children);

    if (!isHtml(title)) {
      const parts = title.split("/");

      if (parts.length > 1) {
        group = parts.shift().trim();
        title = parts.join("/").trim();
      }
    }

    feature.title = title;
    feature.group = group;
  }

  const [description, struct] = splitItems(result);
  feature.description = await toHtml(description);

  await collectData(struct, feature.structure, [feature.structure]);

  return feature;
};

/**
 * Since it uses cy.readFile(), it can be executed only within cypress hooks like before().
 *
 * @param {string} path Path to markdown file from feature root
 * @returns
 */
export const createFeatureFromMarkdown = (path, group = "") =>
  cy.readFile(path).then(
    (content) =>
      new Cypress.Promise((resolve, reject) => {
        parseMarkdownFeature(content)
          .then((state) => {
            if (group) {
              state.group = group;
            }

            registerFeature(state);
            const feature = wrapFeatureState(state);
            resolve(feature);
          })
          .catch(reject);
      })
  );

/**
 * It immediately returns empty feature and creates a before() hook which reads markdown file.
 * Once markdown has been read, its content(title, description, structure) merged
 * with returned feature.
 *
 * This way we don't need to wait for a promise or wrap it into lifecycle hooks.
 *
 * @param {string} path Path to markdown file from feature root
 * @returns FeatureApi
 */
export const createFeatureFromMarkdownAsync = (path, group = "") => {
  const feature = createFeature({
    title: "",
    description: "",
    group,
  });

  before(() => {
    cy.readFile(path).then(
      (content) =>
        new Cypress.Promise((resolve, reject) => {
          parseMarkdownFeature(content)
            .then((state) => {
              feature.structure().merge(state.structure);
              feature.headers(state.headers);
              feature.valueOf().title = state.title;
              feature.valueOf().description = state.description;
              if (!feature.valueOf().group && state.group) {
                feature.valueOf().group = state.group;
              }

              resolve(feature);
            })
            .catch(reject);
        })
    );
  });

  return feature;
};
