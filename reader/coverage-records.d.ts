export type ProjectStructure = Record<string, ProjectStructure>;

export type ProjectRequirement = {
  title: string;
  parent: ProjectRequirement;
  specs: ProjectSpec[];
  files: Record<string, ProjectFile>;
  /*
   * Represents traces structure in the file
   * trace('Group A', () => {
   *   trace('Requirement 1');
   *   trace('Requirement 2');
   * });
   */
  children: Record<string, ProjectRequirement>;
};

export type ProjectSpec = {
  id: string;
  file: ProjectFile;
  title: string;
  filePath: string;
  titlePath: string;
  requirements: ProjectRequirement[];
};

export type ProjectFile = Record<string, ProjectSpec>;

export type Project = {
  title: string;
  depth: number;
  structure: ProjectStructure;
  requirements: Record<string, ProjectRequirement>;
  files: Record<string, ProjectFile>;
  specs: Record<string, ProjectSpec>;
  source: object;
};

export declare const readRecords: (
  filePath: string,

  // it potentially can be optional but better not
  globalProjects: Record<string, Project>
) => Promise<Project[]>;

module.exports.readRecords = readRecords;
