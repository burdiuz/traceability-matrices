import type { Spec } from "./specs";

export type FeatureRecord = {
  requirement: string | string[];
  title: string;
  filePath: string;
  titlePath: string[];
};

export type FeatureJSON = {
  title: string;
  description: string;
  group: string;
  structure: object;
  headers: string[];
  records: FeatureRecord[];
};

export type FeatureFileJSON = FeatureJSON[];

export type GlobalFeature = {
  id: string;
  title: string;
  description: string;
  group: string;
  depth: number;
  readonly headers: string[];
  readonly structure: object;
  files: Record<string, Record<string, Spec[]>>;
  records: Record<string, Spec[]>;
};

export type LocalFeature = GlobalFeature & {
  readonly global: GlobalFeature;
  readonly depth: number;
};

export type Feature = LocalFeature | GlobalFeature;

export type FileInfo = {
  id: string;
  name: string;
  specName: string;
  path: string;
  features: LocalFeature[];
};

export type DirectoryInfo = {
  path: string;

  // local path starts from coverage root
  localPath: string;
  name: string;
  hasFiles: boolean;
  hasFilesDeep: boolean;
  children: DirectoryInfo[];
  files: FileInfo[];
};
