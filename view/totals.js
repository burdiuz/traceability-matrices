/**
 *
 * @param {import("../reader/coverage-records").Project} param0
 * @returns
 */
const calculateProjectStats = ({ title, records, structure }) => {
  const specs = new Set();
  const list = Object.values(records);
  const requirementsTotal = list.length;
  let requirementsCovered = 0;

  list.forEach((record) => {
    if (!record.length) {
      return;
    }

    requirementsCovered++;

    record.forEach(({ filePath, titlePath }) => {
      specs.add(`${filePath}:${titlePath.join("/")}`);
    });
  });

  return {
    covered: requirementsCovered >= requirementsTotal,
    requirementsCovered,
    requirementsTotal,
    specsCount: specs.size,
  };
};

/**
 *
 * @param {import("./reader/reader").ReadCoverageResult} state
 */
const calculateTotals = (state) => {
  const projects = Object.values(state.projects);

  const {
    requirementsCovered: covered,
    requirementsTotal: requirements,
    specsCount: specs,
  } = projects.reduce(
    (counts, project) => {
      const { requirementsCovered, requirementsTotal, specsCount } =
        calculateProjectStats(project);

      return {
        requirementsCovered: requirementsCovered + counts.requirementsCovered,
        requirementsTotal: requirementsTotal + counts.requirementsTotal,
        specsCount: specsCount + counts.specsCount,
      };
    },
    { requirementsCovered: 0, requirementsTotal: 0, specsCount: 0 }
  );

  const fileCount = state.roots.reduce(
    (total, result) =>
      total + result.list.reduce((count, { files }) => count + files.length, 0),
    0
  );

  return {
    projects: projects.length,
    files: fileCount,
    specs,
    requirements,
    covered,
    coverage: ((covered / requirements) * 100).toFixed(0),
  };
};

module.exports.calculateProjectStats = calculateProjectStats;
module.exports.calculateTotals = calculateTotals;
