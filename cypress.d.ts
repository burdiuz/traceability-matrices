export type Feature = {
  title: String;
  description: string;
  structure: Record<string, object>;
  headers: string[];
  records: Record<string, object>;
};

export type FeatureApi = {
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
      featureTitle: string,
      featureDescription?: string
    ) => FeatureApi;
    narrow: (
      path: string[],
      featureTitle: string,
      featureDescription?: string
    ) => FeatureApi;
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
  valueOf: () => Feature;
  clone: () => FeatureApi;
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
       * Feature requirements structure
       */
      structure: Record<string, object>
    ) => string | string[]
  ) => void;
};

export declare const createEmptyFeatureState: (
  title: String,
  description?: string
) => Feature;

export declare const registerFeature: (feature: Feature | FeatureApi) => void;

export declare const wrapFeatureState: (state: Feature) => FeatureApi;

export declare const createFeature: (
  featureTitle: string,
  featureDescription?: string
) => FeatureApi;

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
