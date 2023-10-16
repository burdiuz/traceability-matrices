import * as fs from "fs";

const createEmptyFeatureState = ({ title, description = "", group = "" }) => ({
  title,
  group,
  description,
  structure: {},
  headers: [],
  records: [],
});

(async () => {
  const content = fs.readFileSync("./FeatureJson.json", { encoding: "utf-8" });

  // ---------------------- json.js parser code starts

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

  const parseJsonFeature = async (content) => {
    const doc = JSON.parse(content);
    const feature = createEmptyFeatureState(doc);

    feature.structure = renderStructure(doc.structure);

    return feature;
  };

  // ---------------------- json.js parser code ends

  const feature = await parseJsonFeature(content);

  console.log(feature.structure);
})();
