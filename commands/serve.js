const Koa = require("koa");
const https = require("https");
const { readFile } = require("fs/promises");
const { resolve } = require("path");
const Router = require("@koa/router");
const { readCoverage } = require("../reader/reader");
const { renderFile } = require("../view/file");
const { renderFiles } = require("../view/files");
const { renderProject } = require("../view/project");
const { renderProjects } = require("../view/projects");
const { calculateTotals } = require("../view/totals");
const { pageTemplate } = require("../view/page");

const inModulePath = (path) => resolve(__dirname, path);

const links = {
  getFilesLink: () => "/files",
  getProjectsLink: () => "/projects",
  getFileLink: (id) => `/file?id=${id}`,
  getProjectLink: (title) => `/project?id=${encodeURIComponent(title)}`,
  getRefreshLink: () => "/refresh",
};

const serve = async (
  targetDirs,
  port,
  keyFilePath = "",
  certFilePath = "",
  projectTableType = "default"
) => {
  const useHttps = Boolean(keyFilePath && certFilePath);
  let state = await readCoverage(targetDirs);
  let totals = calculateTotals(state);

  const app = new Koa();
  const router = new Router();

  router.get("/", (ctx, next) => {
    ctx.redirect("/projects");
  });

  router.get("/files", (ctx, next) => {
    const content = renderFiles(state, links);

    ctx.response.body = pageTemplate({
      pageTitle: "Files",
      links,
      totals,
      content,
    });
  });

  // /file?id=<file_path>
  router.get("/file", (ctx, next) => {
    const [, searchParamsStr] = ctx.request.url.match(/^[^?]+\?(.+)$/) || [];
    const searchParams = new URLSearchParams(searchParamsStr);
    const filePath = searchParams.get("id");
    const { [filePath]: file } = state.files;

    if (!file) {
      ctx.response.body = "File not found.";
      return;
    }

    const content = renderFile(file, state, links, projectTableType);

    ctx.response.body = pageTemplate({
      pageTitle: filePath,
      links,
      totals,
      content,
    });
  });

  router.get("/projects", (ctx, next) => {
    const content = renderProjects(state, links);

    ctx.response.body = pageTemplate({
      pageTitle: "Projects",
      links,
      totals,
      content,
    });
  });

  // /file?id=<project_name>
  router.get("/project", (ctx, next) => {
    const [, searchParamsStr] = ctx.request.url.match(/^[^?]+\?(.+)$/) || [];
    const searchParams = new URLSearchParams(searchParamsStr);
    const projectId = searchParams.get("id");
    const { [projectId]: project } = state.projects;

    if (!project) {
      ctx.response.body = "Project not found.";
      return;
    }

    const content = renderProject(project, state, links, projectTableType);

    ctx.response.body = pageTemplate({
      pageTitle: projectId,
      links,
      totals,
      content,
    });
  });

  router.get("/refresh", async (ctx, next) => {
    state = await readCoverage(targetDirs);
    totals = calculateTotals(state);

    const { referer } = ctx.request.headers;

    // simple going back in history does not refresh the page, ti is taken from cache
    // so we do a redirect to the referrer page if possible
    if (referer) {
      ctx.redirect(referer);
    } else {
      ctx.response.body = `<p>Refresh completed, going back...</p> <script>window.history.back();</script>`;
    }
  });

  app.use(router.routes()).use(router.allowedMethods());

  if (useHttps) {
    https
      .createServer(
        {
          key: await readFile(keyFilePath),
          cert: await readFile(certFilePath),
        },
        app.callback()
      )
      .listen(port);
  } else {
    app.listen(port);
  }
};

module.exports.serve = serve;
