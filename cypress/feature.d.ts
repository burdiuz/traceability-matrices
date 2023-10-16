import { Feature } from "./types";
export type CreateFeatureParams = {
    title: string;
    group?: string;
    description?: string;
};
/**
 * Storing and assigning a list from global nsmepsace will allow to collect all features
 * of current test run from independent instances of this module.
 * It might be useful if this file gets bundled with other module and used there, by runtime
 * it will br treated as a separate module and without this check it will have own features
 * list and might overwrite coverage from other sources for same spec file.
 *
 */
export declare const features: Feature[];
export declare const setupSaveHook: (features: Feature[], path?: string) => void;
export declare const createEmptyFeatureState: ({ title, group, description, }: CreateFeatureParams) => Feature;
export declare const wrapFeatureState: (feature: Feature) => {
    clone: (params: CreateFeatureParams) => any;
    branch: (params: CreateFeatureParams & {
        path: string[];
    }) => any;
    narrow: (params: CreateFeatureParams & {
        path: string[];
    }) => any;
    valueOf: () => Feature;
    structure: (data?: object, columnHeaders?: string[]) => {
        add: (...path: string[]) => object;
        get: (...path: string[]) => object;
        merge: (struct: object) => void;
        clone: () => object;
        branch: (path: string[]) => object;
        narrow: (path: string[]) => object;
    };
    headers: (columnHeaders?: string[]) => {
        clone: () => string[];
        get: (index: number) => string;
        set: (index: number, header: string) => void;
    };
    category: (...categoryPath: string[]) => {
        requirement: (...path: string[]) => {
            describe: (...args: [string, () => void] | [string, object, () => void]) => void;
            context: (...args: [string, () => void] | [string, object, () => void]) => void;
            suite: (...args: [string, () => void] | [string, object, () => void]) => void;
            it: (name: string, callback: () => void) => void;
            specify: (name: string, callback: () => void) => void;
            test: (name: string, callback: () => void) => void;
            trace: (chainFn?: () => void) => void;
        };
        trace: (nameOrPath: string | string[], chainFn?: () => void) => void;
    };
    requirement: (...path: string[]) => {
        describe: (...args: [string, () => void] | [string, object, () => void]) => void;
        context: (...args: [string, () => void] | [string, object, () => void]) => void;
        suite: (...args: [string, () => void] | [string, object, () => void]) => void;
        it: (name: string, callback: () => void) => void;
        specify: (name: string, callback: () => void) => void;
        test: (name: string, callback: () => void) => void;
        trace: (chainFn?: () => void) => void;
    };
    trace: (nameOrPath: string | string[], chainFn?: () => void) => void;
    setTraceToRequirementMatcher: (matcher: any) => void;
};
export type FeatureApi = ReturnType<typeof wrapFeatureState>;
export declare const registerFeature: (feature: Feature | FeatureApi) => number;
export declare const createFeature: (params: CreateFeatureParams) => {
    clone: (params: CreateFeatureParams) => any;
    branch: (params: CreateFeatureParams & {
        path: string[];
    }) => any;
    narrow: (params: CreateFeatureParams & {
        path: string[];
    }) => any;
    valueOf: () => Feature;
    structure: (data?: object, columnHeaders?: string[]) => {
        add: (...path: string[]) => object;
        get: (...path: string[]) => object;
        merge: (struct: object) => void;
        clone: () => object;
        branch: (path: string[]) => object;
        narrow: (path: string[]) => object;
    };
    headers: (columnHeaders?: string[]) => {
        clone: () => string[];
        get: (index: number) => string;
        set: (index: number, header: string) => void;
    };
    category: (...categoryPath: string[]) => {
        requirement: (...path: string[]) => {
            describe: (...args: [string, () => void] | [string, object, () => void]) => void;
            context: (...args: [string, () => void] | [string, object, () => void]) => void;
            suite: (...args: [string, () => void] | [string, object, () => void]) => void;
            it: (name: string, callback: () => void) => void;
            specify: (name: string, callback: () => void) => void;
            test: (name: string, callback: () => void) => void;
            trace: (chainFn?: () => void) => void;
        };
        trace: (nameOrPath: string | string[], chainFn?: () => void) => void;
    };
    requirement: (...path: string[]) => {
        describe: (...args: [string, () => void] | [string, object, () => void]) => void;
        context: (...args: [string, () => void] | [string, object, () => void]) => void;
        suite: (...args: [string, () => void] | [string, object, () => void]) => void;
        it: (name: string, callback: () => void) => void;
        specify: (name: string, callback: () => void) => void;
        test: (name: string, callback: () => void) => void;
        trace: (chainFn?: () => void) => void;
    };
    trace: (nameOrPath: string | string[], chainFn?: () => void) => void;
    setTraceToRequirementMatcher: (matcher: any) => void;
};
