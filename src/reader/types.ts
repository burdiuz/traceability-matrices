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
  readonly structure: object;
  files: Record<string, Record<string, FeatureRecord[]>>;
  records: Record<string, FeatureRecord[]>;
};

export type Feature = GlobalFeature & {
  readonly global: GlobalFeature;
  readonly depth: number;
};

export type FileInfo = {
  id: string;
  name: string;
  specName: string;
  path: string;
  features: Feature[];
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
