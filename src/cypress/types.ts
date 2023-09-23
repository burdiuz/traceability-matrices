export type Record = {
  requirement: string | string[];
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

export type MatcherFn = (
  name: string | string[],
  structure: object
) => string | string[];
