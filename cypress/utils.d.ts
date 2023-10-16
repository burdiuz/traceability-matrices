export declare const getStructureBranch: (structure: object, path: string[]) => object;
export declare const mergeStructure: (source: object, target: object) => void;
export declare const cloneStructure: (source: object, target?: object) => object;
export declare const readStructureRequirements: (structure: object) => [string, string[]][];
export declare const concatPath: (...args: (undefined | string | string[])[]) => string | string[];
