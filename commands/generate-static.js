const { writeFile } = require("fs/promises");
const { join, basename } = require("path");
const { readCoverage } = require("../reader/reader");
const { renderFile } = require("../view/file");
const { renderFiles } = require("../view/files");
const { renderProject } = require("../view/project");
const { renderProjects } = require("../view/projects");
const { calculateTotals } = require("../view/totals");
const { pageTemplate } = require("../view/page");
const { mkdirSync, existsSync } = require("fs");

const getLinks = (pathBack) => ({
  getFilesLink: () => join(pathBack, "files.html"),
  getProjectsLink: () => join(pathBack, "projects.html"),
  getFileLink: (path) =>
    join(
      pathBack,
      "files",
      `${basename(path.replace(/[/\\]+/g, "_"), ".json")}.html`
    ),
  getProjectLink: (title) => join(pathBack, "projects", `${title}.html`),
});

const createStaticHtmlWriter =
  (outputDir, state, totals) => (savePath, backPath, pageTitle, renderer) => {
    const links = getLinks(backPath);

    return writeFile(
      join(outputDir, savePath),
      pageTemplate({
        pageTitle,
        links,
        totals,
        content: renderer(state, links),
      }),
      { encoding: "utf-8" }
    );
  };

const generateStatic = async (targetDirs, outputDir, projectTableType) => {
  const state = await readCoverage(targetDirs);
  const totals = calculateTotals(state);
  const writeHtml = createStaticHtmlWriter(outputDir, state, totals);

  // files
  const filesDir = join(outputDir, "files");

  if (!existsSync(filesDir)) {
    mkdirSync(filesDir);
  }

  await Promise.all(
    Object.entries(state.files).map(([filePath, file]) =>
      writeHtml(
        getLinks(".").getFileLink(filePath),
        "..",
        filePath,
        (state, links) => renderFile(file, state, links, projectTableType)
      )
    )
  );

  await writeHtml("files.html", ".", "Files", renderFiles);

  // projects
  const projectsDir = join(outputDir, "projects");

  if (!existsSync(projectsDir)) {
    mkdirSync(projectsDir);
  }

  await Promise.all(
    Object.entries(state.projects).map(([projectTitle, project]) =>
      writeHtml(
        getLinks(".").getProjectLink(projectTitle),
        "..",
        projectTitle,
        (state, links) => renderProject(project, state, links, projectTableType)
      )
    )
  );

  await writeHtml("projects.html", ".", "Projects", renderProjects);
};

module.exports.generateStatic = generateStatic;
