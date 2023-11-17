import type { Coverage, Feature } from "../reader";

export type FeatureTotals = {
  covered: boolean;
  coverage: number;
  requirementsCovered: number;
  requirementsTotal: number;
  specsCount: number;
};

export type Totals = {
  features: number;
  files: number;
  specs: number;
  requirements: number;
  covered: number;
  coverage: string;
};

export const calculateFeatureStats = ({ records }: Feature): FeatureTotals => {
  const specs = new Set();
  const list = Object.values(records);
  const requirementsTotal = list.length;
  let requirementsCovered = 0;

  list.forEach((record) => {
    if (!record.length) {
      return;
    }

    requirementsCovered++;

    record.forEach(({ id }) => {
      specs.add(id);
    });
  });

  return {
    covered: requirementsCovered >= requirementsTotal,
    coverage: Math.floor((requirementsCovered / requirementsTotal) * 100),
    requirementsCovered,
    requirementsTotal,
    specsCount: specs.size,
  };
};

export const calculateTotals = (state: Coverage): Totals => {
  const features = Object.values(state.features);

  const {
    requirementsCovered: covered,
    requirementsTotal: requirements,
    specsCount: specs,
    coverage,
  } = features.reduce(
    (counts, feature) => {
      const { requirementsCovered, requirementsTotal, specsCount, coverage } =
        calculateFeatureStats(feature);

      return {
        requirementsCovered: requirementsCovered + counts.requirementsCovered,
        requirementsTotal: requirementsTotal + counts.requirementsTotal,
        specsCount: specsCount + counts.specsCount,
        coverage: coverage + counts.coverage,
      };
    },
    { requirementsCovered: 0, requirementsTotal: 0, specsCount: 0, coverage: 0 }
  );

  const fileCount = state.roots.reduce(
    (total, result) =>
      total + result.list.reduce((count, { files }) => count + files.length, 0),
    0
  );

  return {
    features: features.length,
    files: fileCount,
    specs,
    requirements,
    covered,
    /*
     * one feature may have 1 requirement and give 100% and other 100 requirements and give 10%
     * when counting features they will give 55% total coverage ( 110 / 2 )
     * but when counting by requirements they will give 10.89% total coverage (11 / 101 * 100%)
     */
    // counts by features
    coverage: String(Math.floor(coverage / features.length)),
    // counts by requirements
    // coverage: ((covered / requirements) * 100).toFixed(0),
  };
};
