const { readCoverage } = require("../reader/reader");
const { buildVerticalHeaders } = require("../view/project");

/**
 * displays coverage information
 * @param {import("./reader/reader").ReadCoverageResult} state
 *
 */
const readCoverageStats = ({ projects }, includeProjects = []) => {
  const list = Object.values(projects);
  let projectCount = list.length;
  let combinedCoverage = 0;

  console.log("Coverage Information");

  list.forEach((project) => {
    if (includeProjects.length && !includeProjects.includes(project.title)) {
      projectCount--;
      return;
    }

    const result = buildVerticalHeaders(project);
    let coverage = 100;

    if (result.requirements.length) {
      coverage = (result.requirementsCovered / result.requirementsTotal) * 100;
      combinedCoverage += coverage;
    } else {
      // exclude empty projects from total coverage calculation
      projectCount--;
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
      project.title
    );

    result.rows.forEach((row) =>
      row.forEach((cell) => {
        if (cell.category) {
          console.log(`${score(cell)} ${cell.title}`);
          return;
        }

        let covered = !!project.records[cell.name].length;

        console.log(
          covered ? "\x1b[32m%s\x1b[0m" : "\x1b[31m%s\x1b[0m",
          `${" ".repeat(cell.depth * 2)}${covered ? "+" : "-"} ${cell.title}`
        );
      })
    );
  });

  const totalCoverage = combinedCoverage / projectCount;

  console.log("-------------------------------------------");
  console.log("Coverage:", `${totalCoverage.toFixed(2)}%`);
};

const stats = async (targetDirs, projects) => {
  const state = await readCoverage(targetDirs);

  readCoverageStats(state, projects);
};

module.exports.stats = stats;
