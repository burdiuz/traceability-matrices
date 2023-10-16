/// <reference path="../src/cypress/Cypress.d.ts" />
import { Feature, MatcherFn } from "./types";
export declare const createTraceFn: ({ feature, traceToRequirementMatcher, categoryPath, }: {
    feature: Feature;
    traceToRequirementMatcher?: MatcherFn;
    categoryPath?: string[];
}) => (nameOrPath: string | string[], chainFn?: () => void) => void;
export declare const createRequirementApi: (scope: {
    feature: Feature;
    traceToRequirementMatcher?: MatcherFn;
    categoryPath?: string[];
}) => (...path: string[]) => {
    describe: (...args: [string, () => void] | [string, object, () => void]) => void;
    context: (...args: [string, () => void] | [string, object, () => void]) => void;
    suite: (...args: [string, () => void] | [string, object, () => void]) => void;
    it: (name: string, callback: () => void) => void;
    specify: (name: string, callback: () => void) => void;
    test: (name: string, callback: () => void) => void;
    trace: (chainFn?: () => void) => void;
};
export declare const createCategoryApi: (parentScope: {
    feature: Feature;
    traceToRequirementMatcher?: MatcherFn;
}) => (...categoryPath: string[]) => {
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
