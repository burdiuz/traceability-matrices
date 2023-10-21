import { writeFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { mkdirSync, existsSync } from "node:fs";
import { readCoverage } from "../reader";
import { renderFile } from "../view/file";
import { renderFiles } from "../view/files";
import { renderFeature } from "../view/feature";
import { renderFeatures } from "../view/features";
import { calculateTotals } from "../view/totals";
import { listPageTemplate } from "../view/page";

const getLinks = (pathBack) => ({
  getFilesLink: () => join(pathBack, "files.html"),
  getFeaturesLink: () => join(pathBack, "features.html"),
  getFileLink: (path) =>
    join(
      pathBack,
      "files",
      `${basename(path.replace(/[/\\]+/g, "_"), ".json")}.html`
    ),
  getFeatureLink: (title) => join(pathBack, "features", `${title}.html`),
});

const createStaticHtmlWriter =
  (outputDir, state, totals) => (savePath, backPath, pageTitle, renderer) => {
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
    Object.entries(state.features).map(([featureTitle, feature]) =>
      writeHtml(
        getLinks(".").getFeatureLink(featureTitle),
        "..",
        featureTitle,
        (state, links) => renderFeature(feature, state, links, featureTableType)
      )
    )
  );

  await writeHtml("features.html", ".", "Features", renderFeatures);
};
