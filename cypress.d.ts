export type Project = {
  title: String;
  description: string;
  structure: Record<string, object>;
  headers: string[];
  records: Record<string, object>;
};

export type ProjectApi = {
  structure: (
    data?: Record<string, object>,
    headers?: string[]
  ) => {
    add: (...path: string[]) => Record<string, object>;
    get: (...path: string[]) => Record<string, object>;
    merge: (source: Record<string, object>) => void;
    clone: (...path: string[]) => Record<string, object>;
    branch: (
      path: string[],
      projectTitle: string,
      projectDescription?: string
    ) => ProjectApi;
    narrow: (
      path: string[],
      projectTitle: string,
      projectDescription?: string
    ) => ProjectApi;
  };
  headers: (headers?: string[]) => {
    clone: () => string[];
    get: (index: number) => string;
    set: (index: number, title: string) => void;
  };
  trace: (requirement: string | string[], chainFn?: () => void) => void;
  requirement: (...requirement: string[]) => {
    describe: (title: string, ...args: any[]) => any;
    context: (title: string, ...args: any[]) => any;
    suite: (title: string, ...args: any[]) => any;
    it: (title: string, ...args: any[]) => any;
    specify: (title: string, ...args: any[]) => any;
    test: (title: string, ...args: any[]) => any;
    trace: () => void;
  };
  valueOf: () => Project;
  clone: () => ProjectApi;
  setTraceToRequirementMatcher: (
    matcher: (
      /**
       * Traced requirment or path to requirement([category1, category2, requirement])
       */
      nameOrPath: string | string[],
      /**
       * Hash of requirements where 
       *  - property name is a requirement
       *  - property value is a list of ancestor categories
       */
      requirements: Record<string, string[]>,
      /**
       * Project structure
       */
      structure: Record<string, object>
    ) => string | string[]
  ) => void;
};

export declare const createEmptyProjectState: (
  title: String,
  description?: string
) => Project;

export declare const registerProject: (project: Project | ProjectApi) => void;

export declare const wrapProjectState: (state: Project) => ProjectApi;

export declare const createProject: (
  projectTitle: string,
  projectDescription?: string
) => ProjectApi;

export declare const getStructureBranch: (
  structure: Record<string, object>,
  path: string[]
) => Record<string, object>;

export declare const mergeStructure: (
  source: Record<string, object>,
  target: Record<string, object>
) => void;

export declare const cloneStructure: (
  source: Record<string, object>,
  target?: Record<string, object>
) => Record<string, object>;
