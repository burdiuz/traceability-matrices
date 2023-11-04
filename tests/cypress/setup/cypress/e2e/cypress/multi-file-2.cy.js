
import { createFeature } from "@actualwave/traceability-matrices/cypress";

const FeatureA = createFeature({
  title: "Feature A",
  description: "Testing Multifile Feature composition",
  group: "Features",
});

const FeatureC = createFeature({
  title: "Feature C",
  description: "Testing Multifile Feature composition",
  group: "Features",
});

describe('Multi-feature setup', () => {
  it('tracing A and C', () => {
    FeatureA.trace(['High', 'Requirement 1']);
    FeatureA.trace(['High', 'Requirement 3'], () => {
      FeatureC.trace(['Medium', 'Requirement 1'])
      FeatureC.trace(['Medium', 'Requirement 3'])
    });
  });

  it('tracing A and C', () => {
    FeatureC.trace(['High', 'Requirement 1']);
    FeatureC.trace(['High', 'Requirement 3']);
    FeatureA.trace(['Medium', 'Requirement 1'])
    FeatureA.trace(['Medium', 'Requirement 3'])
  });

  it('tracing A and C', () => {
    FeatureC.trace(['Low', 'Requirement 1']);
    FeatureC.trace(['Low', 'Requirement 3'], () => {
      FeatureA.trace(['Low', 'Requirement 1'])
      FeatureA.trace(['Low', 'Requirement 3'])
    });
  });
});