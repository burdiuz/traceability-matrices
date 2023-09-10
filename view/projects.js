const { compile } = require("pug");
const { calculateProjectStats } = require("./totals");
const { renderProjectCategoryList } = require("./project");

const projectsStructureTemplate = compile(
  `
div.flex-vertical
  each project in self.list
    div(class= project.covered ? 'project-link covered' : 'project-link')
      div.project-info
        button.toggle-project-categories(onClick='handleProjectCategoriesToggleVisibility(this.parentElement.parentElement);', title='Show project categories')
          include /icons/bars-staggered-solid.svg
        button.toggle-project-files(onClick='handleProjectFilesToggleVisibility(this.parentElement.parentElement)', title='Show files where project related specs are present')
          include /icons/file-lines-solid.svg
        span.totals #{project.requirementsCovered} / #{project.requirementsTotal}
        a.title(href=self.links.getProjectLink(project.title)) #{project.title}
      | !{project.renderCategories()}
      ul.project-files-list
        each file in project.files
          li
            a(href=self.links.getFileLink(file.path)) #{file.name}
            span  (#{file.requirementsCovered} / #{file.requirementsTotal})  
`,
  { self: true, filename: "pug", basedir: __dirname }
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
      renderCategories: () => renderProjectCategoryList(project, state, links),
      ...stats,
    };
  });

  return projectsStructureTemplate({
    list,
    links,
  });
};

module.exports.renderProjects = renderProjects;
