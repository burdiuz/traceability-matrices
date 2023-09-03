const { compile } = require("pug");
const { calculateProjectStats } = require("./totals");
const { renderProjectCategories } = require("./project");

const projectsStructureTemplate = compile(
  `
div.flex-vertical
  each project in self.list
    div(class= project.covered ? 'project-link covered' : 'project-link')
      span.totals #{project.requirementsCovered} / #{project.requirementsTotal}
      a.title(href=self.links.getProjectLink(project.title)) #{project.title}
      div !{project.renderCategories()}
      div.project-files
        a(href="") Project Files
        input.switch(type="checkbox")
        ul.project-files-list
          each file in project.files
            li
              a(href=self.links.getFileLink(file.path)) #{file.name}
              span  (#{file.requirementsCovered} / #{file.requirementsTotal})  
`,
  { self: true }
);

/**
 *
 * @param {import("../reader/reader").ReadCoverageResult} state
 */
const renderProjects = (state, links) => {
  const filePaths = Object.values(state.files).reduce(
    (res, file) => ({
      ...res,
      [file.path]: file,
    }),
    {}
  );

  const list = Object.values(state.projects).map((project) => {
    const stats = calculateProjectStats(project);

    return {
      title: project.title,
      files: Object.entries(project.files).map(([path, requirements]) => {
        const { total, covered } = Object.values(requirements).reduce(
          ({ total, covered }, specs) => ({
            total: total + 1,
            covered: covered + Boolean(specs.length),
          }),
          { total: 0, covered: 0 }
        );
        return {
          path: filePaths[path].id,
          name: filePaths[path].specName,
          requirementsTotal: total,
          requirementsCovered: covered,
        };
      }),
      renderCategories: () => renderProjectCategories(project, state, links),
      ...stats,
    };
  });

  return projectsStructureTemplate({
    list,
    links,
  });
};

module.exports.renderProjects = renderProjects;
