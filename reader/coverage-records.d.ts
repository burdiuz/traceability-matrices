export type ProjectStructure = Record<string, object>;

export type ProjectSpec = {
  title: string;
  filePath: string;
  titlePath: string[];
};

export type Project = {
  title: string;
  readonly depth: number;
  readonly structure: ProjectStructure;
  readonly global: Project;
  files: Record<string, Project>;
  records: Record<string, ProjectSpec[]>;
};

export type GlobalProject = Project;

export declare const getStructureLeafNodes: (
  structure: ProjectStructure,
  requirements?: string[]
) => string[];

export declare const readRecords: (
  filePath: string,
  globalProjects: Record<string, GlobalProject>
) => Promise<Record<string, Project>>;
