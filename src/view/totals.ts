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
    coverage: Math.round((requirementsCovered / requirementsTotal) * 100),
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
  } = features.reduce(
    (counts, feature) => {
      const { requirementsCovered, requirementsTotal, specsCount } =
        calculateFeatureStats(feature);

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
    features: features.length,
    files: fileCount,
    specs,
    requirements,
    covered,
    coverage: ((covered / requirements) * 100).toFixed(0),
  };
};
