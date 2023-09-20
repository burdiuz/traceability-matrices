const { readCoverage } = require("../reader/reader");
const { buildVerticalHeaders } = require("../view/feature");

/**
 * displays coverage information
 * @param {import("./reader/reader").ReadCoverageResult} state
 *
 */
const readCoverageStats = ({ features }, includeFeatures = []) => {
  const list = Object.values(features);
  let featureCount = list.length;
  let combinedCoverage = 0;

  console.log("Coverage Information");

  list.forEach((feature) => {
    if (includeFeatures.length && !includeFeatures.includes(feature.title)) {
      featureCount--;
      return;
    }

    const result = buildVerticalHeaders(feature);
    let coverage = 100;

    if (result.requirements.length) {
      coverage = (result.requirementsCovered / result.requirementsTotal) * 100;
      combinedCoverage += coverage;
    } else {
      // exclude empty features from total coverage calculation
      featureCount--;
    }

    /**
     *
     * @param {{depth: number, requirementsCovered: number, requirementsTotal: number}} param0
     * @returns {string}
     */
    const score = ({ depth, requirementsCovered, requirementsTotal }) =>
      `${" ".repeat(depth * 2)}${requirementsCovered}/${requirementsTotal}`;

    console.log("-------------------------------------------");
    console.log(
      score(result),
      result.requirements.length ? `${coverage.toFixed(2)}%` : "100%",
      feature.title
    );

    result.rows.forEach((row) =>
      row.forEach((cell) => {
        if (cell.category) {
          console.log(`${score(cell)} ${cell.title}`);
          return;
        }

        let covered = !!feature.records[cell.name].length;

        console.log(
          covered ? "\x1b[32m%s\x1b[0m" : "\x1b[31m%s\x1b[0m",
          `${" ".repeat(cell.depth * 2)}${covered ? "+" : "-"} ${cell.title}`
        );
      })
    );
  });

  const totalCoverage = combinedCoverage / featureCount;

  console.log("-------------------------------------------");
  console.log("Coverage:", `${totalCoverage.toFixed(2)}%`);
};

const stats = async (targetDirs, features) => {
  const state = await readCoverage(targetDirs);

  readCoverageStats(state, features);
};

module.exports.stats = stats;
