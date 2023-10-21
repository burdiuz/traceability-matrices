import https from "node:https";
import Koa from "koa";
import Router from "@koa/router";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { readCoverage } from "../reader";
import { renderFile } from "../view/file";
import { renderFiles } from "../view/files";
import { renderFeature } from "../view/feature";
import { renderFeatures } from "../view/features";
import { calculateTotals } from "../view/totals";
import { listPageTemplate } from "../view/page";

const inModulePath = (path) => resolve(__dirname, path);

const links = {
  getFilesLink: () => "/files",
  getFeaturesLink: () => "/features",
  getFileLink: (id) => `/file?id=${id}`,
  getFeatureLink: (title) => `/feature?id=${encodeURIComponent(title)}`,
  getRefreshLink: () => "/refresh",
};

export const serve = async (
  targetDirs: string[],
  port: number,
  keyFilePath = "",
  certFilePath = "",
  featureTableType: "default" | "compact" = "default"
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

    ctx.response.body = listPageTemplate({
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

    ctx.response.body = listPageTemplate({
      pageTitle: filePath,
      links,
      totals,
      content,
    });
  });

  router.get("/features", (ctx, next) => {
    const content = renderFeatures(state, links);

    ctx.response.body = listPageTemplate({
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

    ctx.response.body = listPageTemplate({
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
