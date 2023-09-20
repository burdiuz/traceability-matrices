const { compile } = require("pug");
const { calculateFeatureStats } = require("./totals");

const fileStructureTemplate = compile(
  `
div.flex-vertical
  each result in self.roots
    div.dir-root #{result.root.name}
    each dir in result.list
      if dir.files.length
        div.directory
          div.dir-path #{dir.localPath}
          each file in dir.files
            div.file
              a(href=self.links.getFileLink(file.id)) #{file.specName}
              div.file-features
                each feature in self.listFileFeatures(file)
                  span.file-feature #{feature.title} #{feature.requirementsCovered} / #{feature.requirementsTotal}

`,
  { self: true }
);

/**
 *
 * @param {import("../reader/reader").ReadCoverageResult} state
 */
const renderFiles = (state, links) => {
  return fileStructureTemplate({
    ...state,
    links,

    // TODO CACHE totals per file and feature
    listFileFeatures: (file) =>
      Object.values(file.features).map((feature) => {
        const totals = calculateFeatureStats(feature);
        
        return {
          title: feature.title,
          ...totals,
        };
      }),
  });
};

module.exports.renderFiles = renderFiles;
