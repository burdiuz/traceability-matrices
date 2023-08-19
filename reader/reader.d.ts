import { Project } from "./coverage-records";
import { DirectoryInfo } from "./file-structure";

export type FileWithProjects = {
  id: string;
  name: string;
  path: string;
  specName: string;
  projects: Project[];
};

export type DirectoryWithProjects = Omit<DirectoryInfo, "files"> & {
  files: FileWithProjects[];
};

export type ReadFileResult = {
  root: DirectoryWithProjects;
  list: DirectoryWithProjects[];
};

export type ReadCoverageResult = {
  roots: ReadFileResult[];
  projects: Record<string, Project>;
  files: Record<string, FileWithProjects>;
};

export declare const readCoverage: (paths: string[]) => Promise<ReadCoverageResult>;
