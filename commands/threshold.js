const { readCoverage } = require("../reader/reader");
const { calculateProjectStats } = require("../view/totals");

/**
 * exists with error if coverage lower thresholds
 * @param {import("./reader/reader").ReadCoverageResult} state
 * @param {number} total global coverage threshold
 * @param {number} perProject project minimal coverage
 */
const applyCoverageThresholds = ({ projects }, total, perProject) => {
  const list = Object.values(projects);
  let projectCount = list.length;
  let error = false;
  let combinedCoverage = 0;

  console.log("Coverage Information");
  console.log("-------------------------------------------");

  list.forEach((project) => {
    const { requirementsTotal, requirementsCovered } =
      calculateProjectStats(project);
    const coverage = requirementsTotal
      ? (requirementsCovered / requirementsTotal) * 100
      : 100;

    if (requirementsTotal) {
      combinedCoverage += coverage;
    } else {
      // exclude empty projects from total coverage calculation
      projectCount--;
    }

    const str = `${coverage.toFixed(0).padStart(4, " ")}% - ${project.title}`;

    if (coverage < perProject) {
      console.log("\x1b[31m%s\x1b[0m", str);
      error = true;
    } else {
      console.log("\x1b[32m%s\x1b[0m", str);
    }
    console.log("-------------------------------------------");
  });

  const totalCoverage = combinedCoverage / projectCount;
  const str = `${totalCoverage.toFixed(0).padStart(4, " ")}% - Global coverage`;

  if (totalCoverage < total) {
    console.log("\x1b[31m%s\x1b[0m", str);
    error = true;
  } else {
    console.log("\x1b[32m%s\x1b[0m", str);
  }

  process.exit(Number(error));
};

const threshold = async (targetDirs, total, perProject) => {
  const state = await readCoverage(targetDirs);

  applyCoverageThresholds(state, total, perProject);
};

module.exports.threshold = threshold;
