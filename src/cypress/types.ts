export type Scope = {
  feature: Feature;
  categoryPath: string[];
  traceToRequirementMatcher?: MatcherFn;
  matcherInstalledFor?: string[];
};

export type Record = {
  requirement: string | string[];
  category?: string[];
  filePath: string;
  title: string;
  titlePath: string[];
};

export type Feature = {
  title: String;
  group: string;
  description: string;
  structure: object;
  headers: string[];
  records: Record[];
  valueOf: () => Feature;
};

export type MatcherFn = (params: {
  name: string | string[];
  branch: null | object;
  structure: object;
  categoryPath: string[];
}) => string | string[];
