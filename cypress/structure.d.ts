import { Feature } from "./types";
type HeradersApi = {
    clone: () => string[];
    get: (index: number) => string;
    set: (index: number, header: string) => void;
};
export type HeradersFn = (columnHeaders?: string[]) => HeradersApi;
type StructureApi = {
    add: (...path: string[]) => void;
    get: (...path: string[]) => object;
    merge: (struct: object) => void;
    clone: () => object;
    branch: (path: string[]) => object;
    narrow: (path: string[]) => object;
};
export type StructureFn = (data?: object, columnHeaders?: string[]) => StructureApi;
export declare const createHeadersApi: ({ feature }: {
    feature: Feature;
}) => (columnHeaders?: string[]) => {
    clone: () => string[];
    get: (index: number) => string;
    set: (index: number, header: string) => void;
};
export declare const addBranchTo: (structure: object, path: string[]) => object;
export declare const getBranchOf: (structure: object, path: string[]) => object;
export declare const getNarrowStructure: (structure: object, path: string[]) => object;
export declare const createStructureApi: ({ feature }: {
    feature: Feature;
}) => (data?: object, columnHeaders?: string[]) => {
    add: (...path: string[]) => object;
    get: (...path: string[]) => object;
    merge: (struct: object) => void;
    clone: () => object;
    branch: (path: string[]) => object;
    narrow: (path: string[]) => object;
};
export {};
