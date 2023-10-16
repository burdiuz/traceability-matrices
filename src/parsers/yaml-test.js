import * as fs from "fs";
import { load } from "js-yaml";

const createEmptyFeatureState = ({ title, description = "", group = "" }) => ({
  title,
  group,
  description,
  structure: {},
  headers: [],
  records: [],
});

(async () => {
  const content = fs.readFileSync("./FeatureYaml.yaml", { encoding: "utf-8" });

  // ---------------------- yaml.js parser code starts

  const renderStructure = (parentNode, structure = {}) => {
    if (!parentNode) {
      return structure;
    }

    if (parentNode instanceof Array) {
      parentNode.forEach((node) => {
        if (!node) {
          return;
        }

        if (typeof node === "object") {
          renderStructure(node, structure);
          return;
        }

        structure[String(node)] = {};
      });

      return structure;
    }

    if (typeof parentNode === "object") {
      Object.entries(parentNode).forEach(([key, node]) => {
        structure[key] = renderStructure(node);
      });
    }

    return structure;
  };

  const parseYamlFeature = async (content) => {
    const doc = load(content);
    const feature = createEmptyFeatureState(doc);

    feature.structure = renderStructure(doc.structure);

    return feature;
  };

  // ---------------------- yaml.js parser code ends

  const feature = await parseYamlFeature(content);

  console.log(feature.structure);
})();
