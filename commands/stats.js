const { readCoverage } = require("../reader/reader");

/**
 * displays coverage information
 * @param {import("./reader/reader").ReadCoverageResult} state
 *
 */
const readCoverageStats = ({ projects }) => {
  const list = Object.values(projects);
  let projectCount = list.length;
  let combinedCoverage = 0;

  console.log("Coverage Information");

  list.forEach((project) => {
    let records = 0;
    let covered = 0;

    console.log("-------------------------------------------");
    console.log(project.title);

    Object.entries(project.records)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .forEach(([record, specs]) => {
        records++;
        if (specs.length) {
          covered++;
          console.log("\x1b[32m%s\x1b[0m", ` + ${record}`);
        } else {
          console.log("\x1b[31m%s\x1b[0m", ` - ${record}`);
        }
      });

    let coverage = 100;

    if (records) {
      coverage = (covered / records) * 100;
      combinedCoverage += coverage;
    } else {
      // exclude empty projects from total coverage calculation
      projectCount--;
    }

    console.log(
      "Project coverage:",
      `${covered}/${records}`,
      records ? `${coverage.toFixed(2)}%` : "100%"
    );
  });

  const totalCoverage = combinedCoverage / projectCount;

  console.log("-------------------------------------------");
  console.log(
    "Global coverage:",
    `${totalCoverage.toFixed(2)}%`
  );
};

const stats = async (targetDirs) => {
  const state = await readCoverage(targetDirs);

  readCoverageStats(state);
};

module.exports.stats = stats;
