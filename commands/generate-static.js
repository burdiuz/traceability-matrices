const { writeFile } = require("fs/promises");
const { join, basename } = require("path");
const { readCoverage } = require("../reader/reader");
const { renderFile } = require("../view/file");
const { renderFiles } = require("../view/files");
const { renderFeature } = require("../view/feature");
const { renderFeatures } = require("../view/features");
const { calculateTotals } = require("../view/totals");
const { pageTemplate } = require("../view/page");
const { mkdirSync, existsSync } = require("fs");

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
      pageTemplate({
        pageTitle,
        links,
        totals,
        content: renderer(state, links),
      }),
      { encoding: "utf-8" }
    );
  };

const generateStatic = async (targetDirs, outputDir, featureTableType) => {
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

module.exports.generateStatic = generateStatic;
