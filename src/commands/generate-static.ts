import { writeFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { mkdirSync, existsSync } from "node:fs";
import { type Coverage, readCoverage, Feature } from "../reader/index";
import { renderFile } from "../view/file";
import { renderFiles } from "../view/files";
import { renderFeature } from "../view/feature";
import { renderFeatures } from "../view/features";
import {
  type Totals,
  calculateTotals,
  calculateFeatureStats,
} from "../view/totals";
import { listPageTemplate, featurePageTemplate } from "../view/page";
import type { PageLinks } from "../view/types";

const PATH_REPLACEMENTS = /[/\\:&%$#@^*]+/g;

const getLinks = (pathBack: string): PageLinks => ({
  getFilesLink: () => join(pathBack, "files.html"),
  getFeaturesLink: () => join(pathBack, "features.html"),
  getFileLink: (path: string) =>
    join(
      pathBack,
      "files",
      `${basename(path.replace(PATH_REPLACEMENTS, "_"), ".json")}.html`
    ),
  getFeatureLink: (id: string) =>
    join(pathBack, "features", `${id}.html`.replace(PATH_REPLACEMENTS, "_")),
});

const createStaticHtmlWriter =
  (outputDir: string, state: Coverage, totals: Totals) =>
  (
    savePath: string,
    backPath: string,
    pageTitle: string,
    renderer: (state: Coverage, links: PageLinks) => string
  ) => {
    const links = getLinks(backPath);

    return writeFile(
      join(outputDir, savePath),
      listPageTemplate({
        pageTitle,
        links,
        totals,
        content: renderer(state, links),
      }),
      { encoding: "utf-8" }
    );
  };

const writerFeatureHtml = (
  savePath: string,
  pageTitle: string,
  feature: Feature,
  state: Coverage,
  links: PageLinks,
  featureTableType: "default" | "compact"
) => {
  const totals = calculateFeatureStats(feature);

  return writeFile(
    savePath,
    featurePageTemplate({
      pageTitle,
      links,
      totals,
      content: renderFeature(feature, state, links, featureTableType),
    }),
    { encoding: "utf-8" }
  );
};

export const generateStatic = async (
  targetDirs: string[],
  outputDir: string,
  featureTableType: "default" | "compact"
) => {
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
        (state, links) => renderFile(file, state, links, featureTableType)
      )
    )
  );

  await writeHtml("files.html", ".", "Files", renderFiles);

  // features
  const featuresDir = join(outputDir, "features");

  if (!existsSync(featuresDir)) {
    mkdirSync(featuresDir);
  }

  await Promise.all(
    Object.values(state.features).map((feature) =>
      writerFeatureHtml(
        join(outputDir, getLinks(".").getFeatureLink(feature.id)),
        feature.group ? `${feature.group} / ${feature.title}` : feature.title,
        feature,
        state,
        getLinks(".."),
        featureTableType
      )
    )
  );

  await writeHtml("features.html", ".", "Features", renderFeatures);
};
