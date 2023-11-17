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
  const content = fs.readFileSync("./ParserXml.xml");

  // ---------------------- xml.js parser code starts

  const getNodeContent = (node) => {
    if (!node) {
      return "";
    }

    const hasElements = !!node.childNodes.find(
      ({ nodeType }) => nodeType === 1
    );

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

  const parseXmlFeature = async (content) => {
    const dom = parse(content);
    const titleNode = dom.querySelector("feature > title");
    const descriptionNode = dom.querySelector("feature > description");
    const groupNode = dom.querySelector("feature > group");
    const feature = createEmptyFeatureState({
      title: getNodeContent(titleNode),
      group: getNodeContent(groupNode),
      description: getNodeContent(descriptionNode),
    });
  
    const rootNode = dom.querySelector("feature");
    const [, structure] = createCategory(rootNode);
    feature.structure = structure;

    return feature;
  }

  // ---------------------- html.js parser code ends

   const feature = await parseXmlFeature(content);

   console.log(feature.structure);
})();
