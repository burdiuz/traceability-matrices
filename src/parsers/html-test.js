import * as fs from "fs";
import { parse } from "node-html-parser";

const createEmptyFeatureState = ({ title, description = "", group = "" }) => ({
  title,
  group,
  description,
  structure: {},
  headers: [],
  records: [],
});

(async () => {
  const content = fs.readFileSync("./ParserHtml.html");

  // ---------------------- html.js parser code starts

  const getNodeContent = (node) => {
    if (!node) {
      return "";
    }

    const hasElements = !!node.childNodes.find(
      ({ nodeType }) => nodeType === 1
    );

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

  const parseHtmlFeature = async (content) => {
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

  // ---------------------- html.js parser code ends

  const feature = await parseHtmlFeature(content);

  console.log(feature);
})();
