import { Feature } from "./coverage-records";
import { DirectoryInfo } from "./file-structure";

export type FileWithFeatures = {
  id: string;
  name: string;
  path: string;
  specName: string;
  features: Record<string, Feature>;
};

export type DirectoryWithFeatures = Omit<DirectoryInfo, "files"> & {
  files: FileWithFeatures[];
};

export type ReadFileResult = {
  root: DirectoryWithFeatures;
  list: DirectoryWithFeatures[];
};

export type ReadCoverageResult = {
  roots: ReadFileResult[];
  features: Record<string, Feature>;
  files: Record<string, FileWithFeatures>;
};

export declare const readCoverage: (paths: string[]) => Promise<ReadCoverageResult>;
