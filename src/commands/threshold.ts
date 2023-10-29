import { GlobalFeature, readCoverage } from "../reader/index";
import { calculateFeatureStats } from "../view/totals";

/**
 * exists with error if coverage lower thresholds
 * @param {import("./reader/reader").ReadCoverageResult} state
 * @param {number} total global coverage threshold
 * @param {number} perFeature feature minimal coverage
 */
const applyCoverageThresholds = (
  features: Record<string, GlobalFeature>,
  total: number,
  perFeature: number
) => {
  const list = Object.values(features);
  let featureCount = list.length;
  let error = false;
  let combinedCoverage = 0;

  console.log("Coverage Information");
  console.log("-------------------------------------------");

  list.forEach((feature) => {
    const { requirementsTotal, requirementsCovered } =
      calculateFeatureStats(feature);
    const coverage = requirementsTotal
      ? (requirementsCovered / requirementsTotal) * 100
      : 100;

    if (requirementsTotal) {
      combinedCoverage += coverage;
    } else {
      // exclude empty features from total coverage calculation
      featureCount--;
    }

    const str = `${coverage
      .toFixed(0)
      .padStart(4, " ")}%\t${requirementsCovered}\t/ ${requirementsTotal}\t- ${
      feature.title
    }`;

    if (coverage < perFeature) {
      console.log("\x1b[31m%s\x1b[0m", str);
      error = true;
    } else {
      console.log("\x1b[32m%s\x1b[0m", str);
    }
    console.log("-------------------------------------------");
  });

  const totalCoverage = combinedCoverage / featureCount;
  const str = `${totalCoverage.toFixed(0).padStart(4, " ")}% - Global coverage`;

  if (totalCoverage < total) {
    console.log("\x1b[31m%s\x1b[0m", str);
    error = true;
  } else {
    console.log("\x1b[32m%s\x1b[0m", str);
  }

  process.exit(Number(error));
};

export const threshold = async (
  targetDirs: string[],
  total: number,
  perFeature: number
) => {
  const { features } = await readCoverage(targetDirs);

  applyCoverageThresholds(features, total, perFeature);
};
