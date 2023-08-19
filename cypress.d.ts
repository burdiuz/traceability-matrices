export declare const createProject: (projectTitle: string) => {
  structure: (data?: Record<string, object>, headers?: string[]) => void;
  headers: (headers?: string[]) => {
    set: (index: number, title: string) => void;
  };
  trace: (requirement: string | string[], chainFn?: () => void) => void;
  requirement: (requirement: string | string[]) => {
    describe: (title: string, ...args: any[]) => any;
    context: (title: string, ...args: any[]) => any;
    suite: (title: string, ...args: any[]) => any;
    it: (title: string, ...args: any[]) => any;
    specify: (title: string, ...args: any[]) => any;
    test: (title: string, ...args: any[]) => any;
    trace: () => void;
  };
};
