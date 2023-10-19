export type DirectoryInfo = {
  path: string;

  // local path starts from coverage root
  localPath: string;
  name: string;
  hasFiles: boolean;
  hasFilesDeep: boolean;
  children: DirectoryInfo[];
  files: string[];
};

export type ReadResult = { root: DirectoryInfo; list: DirectoryInfo[] };

export declare const read: (root: string) => Promise<ReadResult>;

export declare const readAll: (paths: string[]) => Promise<ReadResult[]>;
