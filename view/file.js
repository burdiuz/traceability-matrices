const { renderProject } = require("./project");

/**
 * @param {import("../reader/reader").FileWithProjects} file
 * @param {import("../reader/reader").ReadCoverageResult} state
 */
const renderFile = (file, state, links) => {
  const list = Object.values(file.projects).map((source) => {
    return renderProject(source, state, links);
  });

  return list.join("");
};

module.exports.renderFile = renderFile;
