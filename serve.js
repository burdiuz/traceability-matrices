const Koa = require("koa");
const https = require("https");
const { readFile } = require("fs/promises");
const { resolve } = require("path");
const Router = require("@koa/router");
const { readCoverage } = require("./reader/reader");
const { renderFile } = require("./view/file");
const { renderFiles } = require("./view/files");
const { renderProject } = require("./view/project");
const { renderProjects } = require("./view/projects");
const { calculateTotals } = require("./view/totals");

const inModulePath = (path) => resolve(__dirname, path);

const serve = async (targetDirs, port, useHttps = true) => {
  let state = await readCoverage(targetDirs);

  const app = new Koa();
  const router = new Router();

  const pageTemplateText = await readFile(inModulePath("./page.html"), {
    encoding: "utf-8",
  });

  const pageTemplate = (content) => {
    const totals = calculateTotals(state);
    // console.log(totals);

    let template = Object.entries(totals).reduce(
      (tpl, [key, value]) => tpl.replace(`#{${key}}`, value),
      pageTemplateText
    );

    return template.replace("#{content}", content);
  };

  router.get("/", (ctx, next) => {
    ctx.redirect("/files");
  });

  router.get("/files", (ctx, next) => {
    const content = renderFiles(state);

    ctx.response.body = pageTemplate(content);
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

    const content = renderFile(file, state);

    ctx.response.body = pageTemplate(content);
  });

  router.get("/projects", (ctx, next) => {
    const content = renderProjects(state);

    ctx.response.body = pageTemplate(content);
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

    const content = renderProject(project, state);
    ctx.response.body = pageTemplate(content);
  });

  router.get("/refresh", async (ctx, next) => {
    state = await readCoverage(targetDirs);

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
          key: await readFile(resolve(__dirname, "key.pem")),
          cert: await readFile(resolve(__dirname, "cert.pem")),
        },
        app.callback()
      )
      .listen(port);
  } else {
    app.listen(port);
  }
};

module.exports.serve = serve;
