export type FeatureStructure = Record<string, object>;

export type FeatureSpec = {
  title: string;
  filePath: string;
  titlePath: string[];
};

export type Feature = {
  title: string;
  readonly depth: number;
  readonly structure: FeatureStructure;
  readonly global: Feature;
  files: Record<string, Feature>;
  records: Record<string, FeatureSpec[]>;
};

export type GlobalFeature = Feature;

export declare const getStructureLeafNodes: (
  structure: FeatureStructure,
  requirements?: string[]
) => string[];

export declare const addEmptyRecordsFromStructure: (
  structure: FeatureStructure,
  records: Record<string, FeatureSpec[]>
) => void;

export declare const readRecords: (
  filePath: string,
  globalFeatures: Record<string, GlobalFeature>
) => Promise<Record<string, Feature>>;
