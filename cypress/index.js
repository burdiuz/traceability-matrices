const getStructureBranch = (structure, path) => {
    let index = 0;
    let parent = structure;
    while (index < path.length) {
        const name = path[index];
        if (!parent[name]) {
            return null;
        }
        parent = parent[name];
        index++;
    }
    return parent;
};
const mergeStructure = (source, target) => {
    Object.entries(source).forEach(([title, children]) => {
        if (title in target) {
            mergeStructure(children, target[title]);
        }
        else {
            target[title] = children;
        }
    });
};
const cloneStructure = (source, target = {}) => {
    for (let name in source) {
        if (!target[name]) {
            target[name] = {};
        }
        cloneStructure(source[name], target[name]);
    }
    return target;
};
const readStructureRequirements = (structure) => {
    const requirements = [];
    const isEmpty = (structure, categories) => {
        let empty = true;
        Object.entries(structure).forEach(([title, children]) => {
            empty = false;
            if (isEmpty(children, [...categories, title])) {
                requirements.push([title, categories]);
            }
        });
        return empty;
    };
    isEmpty(structure, []);
    return requirements;
};
const concatPath = (...args) => {
    const path = [];
    args.forEach((item) => {
        switch (typeof item) {
            case "string":
                path.push(item);
                break;
            case "number":
            case "boolean":
                path.push(String(item));
                break;
            default:
                if (item) {
                    path.push(...item);
                }
                break;
        }
    });
    return path.length === 1 ? path[0] : path;
};

const addRecordToFeature = (feature, namePath) => {
    const { title, titlePath = [] } = Cypress.currentTest || {};
    let name = namePath;
    if (typeof namePath === "string" || namePath.length <= 1) {
        name = String(namePath);
    }
    feature.records.push({
        requirement: name,
        title: title || "",
        filePath: Cypress.spec.relative,
        titlePath: [...titlePath],
    });
};
const createTraceFn = ({ feature, traceToRequirementMatcher, categoryPath, }) => (nameOrPath, chainFn) => {
    nameOrPath = concatPath(categoryPath, nameOrPath);
    if (traceToRequirementMatcher) {
        nameOrPath = traceToRequirementMatcher(nameOrPath, feature.structure);
    }
    addRecordToFeature(feature, nameOrPath);
    if (chainFn) {
        chainFn();
    }
};
const createRequirementApi = (scope) => (...path) => {
    const { feature, categoryPath } = scope;
    let namePath = concatPath(categoryPath, path);
    if (scope.traceToRequirementMatcher) {
        namePath = scope.traceToRequirementMatcher(namePath, feature.structure);
    }
    // TODO skip adding nested calls to records
    const describeFn = (...args) => {
        let name;
        let params = null;
        let callback;
        if (args.length === 3) {
            [name, params, callback] = args;
        }
        else {
            [name, callback] = args;
        }
        const alteredCallback = () => {
            addRecordToFeature(feature, namePath);
            return callback();
        };
        return params
            ? describe(name, params, alteredCallback)
            : describe(name, alteredCallback);
    };
    const specFn = (name, callback) => {
        const alteredCallback = () => {
            addRecordToFeature(feature, namePath);
            return callback();
        };
        return it(name, alteredCallback);
    };
    return {
        describe: describeFn,
        context: describeFn,
        suite: describeFn,
        it: specFn,
        specify: specFn,
        test: specFn,
        trace: (chainFn) => {
            addRecordToFeature(feature, namePath);
            if (chainFn) {
                chainFn();
            }
        },
    };
};
const createCategoryApi = (parentScope) => (...categoryPath) => {
    const scope = Object.assign(Object.create(parentScope), { categoryPath });
    const requirement = createRequirementApi(scope);
    const trace = createTraceFn(scope);
    return {
        requirement,
        trace,
    };
};

const createHeadersApi = ({ feature }) => (columnHeaders) => {
    if (columnHeaders) {
        feature.headers = columnHeaders;
    }
    return {
        clone: () => feature.headers.concat(),
        get: (index) => feature.headers[index],
        set: (index, header) => {
            feature.headers[index] = header;
        },
    };
};
const addBranchTo = (structure, path) => {
    let index = 0;
    let parent = structure;
    while (index < path.length) {
        const name = path[index];
        if (!parent[name]) {
            parent[name] = {};
        }
        parent = parent[name];
        index++;
    }
    return parent;
};
const getBranchOf = (structure, path) => {
    const branch = getStructureBranch(structure, path);
    if (!branch) {
        throw new Error(`Structure path [${path.length ? `"${path.join('", "')}"` : ""}] is not available.`);
    }
    return cloneStructure(branch);
};
const getNarrowStructure = (structure, path) => {
    const sourceStruct = getStructureBranch(structure, path);
    if (!sourceStruct) {
        throw new Error(`Structure path [${path.length ? `"${path.join('", "')}"` : ""}] is not available.`);
    }
    return cloneStructure(sourceStruct, addBranchTo({}, path));
};
const createStructureApi = ({ feature }) => {
    const add = (...path) => addBranchTo(feature.structure, path);
    const get = (...path) => getStructureBranch(feature.structure, path);
    const merge = (struct) => mergeStructure(struct, feature.structure);
    const clone = () => cloneStructure(feature.structure);
    const branch = (path) => getBranchOf(feature.structure, path);
    const narrow = (path) => getNarrowStructure(feature.structure, path);
    return (data, columnHeaders) => {
        if (data) {
            mergeStructure(data, feature.structure);
        }
        if (columnHeaders) {
            feature.headers = columnHeaders;
        }
        return {
            add,
            get,
            merge,
            clone,
            branch,
            narrow,
        };
    };
};

/**
 * Storing and assigning a list from global nsmepsace will allow to collect all features
 * of current test run from independent instances of this module.
 * It might be useful if this file gets bundled with other module and used there, by runtime
 * it will br treated as a separate module and without this check it will have own features
 * list and might overwrite coverage from other sources for same spec file.
 *
 */
const features = (() => {
    let list = [];
    try {
        if (typeof global !== "undefined" && global) {
            list = global.tm_features || list;
            global.tm_features = list;
        }
        else if (typeof window !== "undefined" && window) {
            list = window.tm_features || list;
            window.tm_features = list;
        }
    }
    catch (error) {
        // global scope is not avialable
    }
    return list;
})();
const setupSaveHook = (features, path = "") => {
    after(() => {
        const filePath = path || Cypress.spec.relative;
        cy.writeFile(`${Cypress.env("TRACE_RECORDS_DATA_DIR")}/${filePath}.json`, JSON.stringify(features, null, 2));
    });
};
const createEmptyFeatureState = ({ title, group = "", description = "", }) => ({
    title,
    group,
    description,
    structure: {},
    headers: [],
    records: [],
    valueOf() {
        return this;
    },
});
const createCloneApi = ({ feature }) => {
    return {
        clone: (params) => {
            const subFeature = createFeature(params);
            const structure = cloneStructure(feature.structure);
            subFeature.structure(structure, feature.headers.concat());
            return subFeature;
        },
        branch: (params) => {
            const { path, ...featureParams } = params;
            const subFeature = createFeature(featureParams);
            const branch = getBranchOf(feature.structure, path);
            subFeature.structure(branch, feature.headers.concat());
            return subFeature;
        },
        narrow: (params) => {
            const { path, ...featureParams } = params;
            const subFeature = createFeature(featureParams);
            const struct = getNarrowStructure(feature.structure, path);
            subFeature.structure(struct, feature.headers.concat());
            return subFeature;
        },
    };
};
const wrapFeatureState = (feature) => {
    const scope = { feature, traceToRequirementMatcher: undefined };
    const setTraceToRequirementMatcher = (matcher) => {
        scope.traceToRequirementMatcher = matcher;
    };
    const cloneProps = createCloneApi(scope);
    const structure = createStructureApi(scope);
    const headers = createHeadersApi(scope);
    const category = createCategoryApi(scope);
    const requirement = createRequirementApi(scope);
    const trace = createTraceFn(scope);
    return {
        valueOf: () => feature,
        structure,
        headers,
        category,
        requirement,
        trace,
        setTraceToRequirementMatcher,
        ...cloneProps,
    };
};
const registerFeature = (feature) => features.push(feature.valueOf());
const createFeature = (params) => {
    const feature = createEmptyFeatureState(params);
    registerFeature(feature);
    return wrapFeatureState(feature);
};

setupSaveHook(features);

export { cloneStructure, createEmptyFeatureState, createFeature, getStructureBranch, mergeStructure, readStructureRequirements, registerFeature, setupSaveHook, wrapFeatureState };
