const { compile } = require("pug");
const { calculateProjectStats } = require("./totals");

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
              a(href=\`/file?id=\${file.id}\`) #{file.specName}
              div.file-projects
                each project in self.listFileProjects(file)
                  span.file-project #{project.title} #{project.requirementsCovered} / #{project.requirementsTotal}

`,
  { self: true }
);

/**
 *
 * @param {import("../reader/reader").ReadCoverageResult} state
 */
const renderFiles = (state) => {
  return fileStructureTemplate({
    ...state,

    // TODO CACHE totals per file and project
    listFileProjects: (file) =>
      Object.values(file.projects).map((project) => {
        const totals = calculateProjectStats(project);
        
        return {
          title: project.title,
          ...totals,
        };
      }),
  });
};

module.exports.renderFiles = renderFiles;
