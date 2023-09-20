const { renderFeature } = require("./feature");

/**
 * @param {import("../reader/reader").FileWithFeatures} file
 * @param {import("../reader/reader").ReadCoverageResult} state
 */
const renderFile = (file, state, links, featureTableType) => {
  const list = Object.values(file.features).map((source) => {
    return renderFeature(source, state, links, featureTableType);
  });

  return list.join("");
};

module.exports.renderFile = renderFile;
