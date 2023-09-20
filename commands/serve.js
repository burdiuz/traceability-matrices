const Koa = require("koa");
const https = require("https");
const { readFile } = require("fs/promises");
const { resolve } = require("path");
const Router = require("@koa/router");
const { readCoverage } = require("../reader/reader");
const { renderFile } = require("../view/file");
const { renderFiles } = require("../view/files");
const { renderFeature } = require("../view/feature");
const { renderFeatures } = require("../view/features");
const { calculateTotals } = require("../view/totals");
const { pageTemplate } = require("../view/page");

const inModulePath = (path) => resolve(__dirname, path);

const links = {
  getFilesLink: () => "/files",
  getFeaturesLink: () => "/features",
  getFileLink: (id) => `/file?id=${id}`,
  getFeatureLink: (title) => `/feature?id=${encodeURIComponent(title)}`,
  getRefreshLink: () => "/refresh",
};

const serve = async (
  targetDirs,
  port,
  keyFilePath = "",
  certFilePath = "",
  featureTableType = "default"
) => {
  const useHttps = Boolean(keyFilePath && certFilePath);
  let state = await readCoverage(targetDirs);
  let totals = calculateTotals(state);

  const app = new Koa();
  const router = new Router();

  router.get("/", (ctx, next) => {
    ctx.redirect("/features");
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

    const content = renderFile(file, state, links, featureTableType);

    ctx.response.body = pageTemplate({
      pageTitle: filePath,
      links,
      totals,
      content,
    });
  });

  router.get("/features", (ctx, next) => {
    const content = renderFeatures(state, links);

    ctx.response.body = pageTemplate({
      pageTitle: "Features",
      links,
      totals,
      content,
    });
  });

  // /file?id=<feature_name>
  router.get("/feature", (ctx, next) => {
    const [, searchParamsStr] = ctx.request.url.match(/^[^?]+\?(.+)$/) || [];
    const searchParams = new URLSearchParams(searchParamsStr);
    const featureId = searchParams.get("id");
    const { [featureId]: feature } = state.features;

    if (!feature) {
      ctx.response.body = "Feature not found.";
      return;
    }

    const content = renderFeature(feature, state, links, featureTableType);

    ctx.response.body = pageTemplate({
      pageTitle: featureId,
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
