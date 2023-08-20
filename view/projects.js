const { compile } = require("pug");
const { calculateProjectStats } = require("./totals");

const projectsStructureTemplate = compile(
  `
div.flex-vertical
  each project in self.list
    div(class= project.covered ? 'project-link covered' : 'project-link')
      span.totals #{project.requirementsCovered} / #{project.requirementsTotal}
      a.title(href=\`/project?id=\${encodeURIComponent(project.title)}\`) #{project.title}
`,
  { self: true }
);

/**
 *
 * @param {import("../reader/reader").ReadCoverageResult} state
 */
const renderProjects = (state) => {
  const list = Object.values(state.projects).map((project) => {
    const stats = calculateProjectStats(project);

    return {
      title: project.title,
      ...stats,
    };
  });

  return projectsStructureTemplate({ list });
};

module.exports.renderProjects = renderProjects;
