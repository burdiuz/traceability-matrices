'use strict';

var path = require('node:path');
var fs = require('node:fs/promises');

const readDirectory = async (rootPath, dirPath, list = []) => {
    const contents = await fs.readdir(dirPath);
    const directory = {
        path: dirPath,
        localPath: dirPath.substr(rootPath.length + 1),
        name: path.basename(dirPath),
        hasFiles: false,
        hasFilesDeep: false,
        children: [],
        files: [],
    };
    for (let value of contents) {
        if (value.charAt(0) === ".")
            continue;
        const valuePath = path.resolve(dirPath, value);
        const stat = await fs.stat(valuePath);
        if (stat.isDirectory()) {
            const { directory: child } = await readDirectory(rootPath, valuePath, list);
            directory.children.push(child);
            if (child.hasFilesDeep) {
                directory.hasFilesDeep = true;
                list.push(child);
            }
        }
        else if (stat.isFile() && path.extname(value) === ".json") {
            directory.hasFiles = true;
            directory.hasFilesDeep = true;
            directory.files.push({
                id: "",
                name: value,
                path: "",
                specName: "",
                features: [],
            });
        }
    }
    return { directory, list };
};
const sortDirList = (list) => list.sort(({ path: a }, { path: b }) => (a < b ? -1 : 1));
const read = async (root) => {
    const list = [];
    const { directory } = await readDirectory(root, root, list);
    return {
        root: directory,
        list: sortDirList(list),
    };
};
const readAll = async (paths) => {
    const data = [];
    for (let root of paths) {
        const result = await read(root);
        data.push(result);
    }
    return data.sort(({ root: { path: a } }, { root: { path: b } }) => a < b ? -1 : 1);
};

const getUniqueRequirementId = (() => {
    let id = 1;
    return () => `requirement-${String(id++).padStart(8, "0")}`;
})();
const removeExtraSpaces = (value) => value.replace(/\s+/g, " ").trim();

/**
 * Lookup for leaf nodes and assign unique ids to them.
 * Treats leaf nodes as requirments and assigns unique id instead of their original value.
 * @param structure
 */
const seedStructure = (structure) => {
    Object.entries(structure).forEach(([key, value]) => {
        key = removeExtraSpaces(key);
        delete structure[key];
        if (Object.keys(value).length) {
            structure[key] = value;
            seedStructure(value);
            return;
        }
        const id = getUniqueRequirementId();
        structure[key] = id;
    });
};
const logStructuralErrorFor = (title) => console.error(`Instances of "${title}" have srutuctural mismatch, please make sure it records similar structure in all test files.
Possible data loss while merging feature instances.`);
const mergeFeatureStructure = (featureTitle, source, target) => {
    Object.entries(source).forEach(([title, children]) => {
        if (title in target) {
            const targetChildren = target[title];
            if (typeof children === "object") {
                if (typeof targetChildren !== "object") {
                    logStructuralErrorFor(featureTitle);
                }
                else {
                    mergeFeatureStructure(featureTitle, children, targetChildren);
                }
                // no need to overwrite requirement id, we just check if there are no mismatch
            }
            else if (typeof targetChildren === "object") {
                logStructuralErrorFor(featureTitle);
            }
        }
        else {
            target[title] = children;
        }
    });
};
/**
 * Returns a map of requirement paths assigned to their ids
 * {
 *  id: path[]
 * }
 * @param structure
 * @param requirements
 * @returns
 */
const getStructureRequirements = (structure, requirements = {}, path = []) => {
    Object.entries(structure).forEach(([key, value]) => {
        const currentPath = [...path, key];
        if (typeof value === "object") {
            getStructureRequirements(value, requirements, currentPath);
            return;
        }
        requirements[value] = currentPath;
    });
    return requirements;
};
const logPathErrorFor = (key) => console.error(`"${key}" was recorded as a requirement and a category. Please, make sure you are tracing a requirement and not a category and run tests to generate updated coverage report.`);
/**
 * Find requirement id by its name or path,
 * if not exists will create structure branch and return id
 * @param keys
 * @param structure
 * @returns
 */
const findPathId = (keys, structure) => {
    const lastIndex = keys.length - 1;
    let parent = structure;
    let id = "";
    for (let index = 0; index < keys.length; index++) {
        const key = keys[index];
        const value = parent[key];
        if (!value) {
            if (index < lastIndex) {
                parent[key] = {};
                parent = parent[key];
            }
            else {
                id = getUniqueRequirementId();
                parent[key] = id;
                break;
            }
        }
        else {
            if (index < lastIndex) {
                // edge case when key exists in records as a requirement and category
                if (typeof value !== "object") {
                    logPathErrorFor(key);
                    // replace string with category object
                    parent[key] = {};
                }
                parent = parent[key];
            }
            else {
                // edge case when key exists in records as a requirement and category
                if (typeof value === "object") {
                    logPathErrorFor(key);
                    return "";
                }
                id = value;
            }
        }
    }
    return id;
};

/**
 * Converts list of requirements
 * [
 *   {
 *     requirement,
 *     spec
 *   },
 *   {
 *     requirement,
 *     spec
 *   },
 * ]
 * to a hash map
 * {
 *   requirement-id: [
 *     spec,
 *   ],
 *   requirement-id: [
 *     spec,
 *   ],
 * }
 */
const convertRecordsListToMap = (list, structure) => {
    const requirements = getStructureRequirements(structure);
    const records = {};
    list.forEach((spec) => {
        let { requirement } = spec;
        let id;
        // find out requirement id
        if (typeof requirement === "string") {
            requirement = removeExtraSpaces(requirement);
            // look for requirement Id by its name
            const reqId = Object.keys(requirements).find((requirementId) => {
                const path = requirements[requirementId];
                return requirement === path[path.length - 1];
            });
            /* if no Id was found, it is a new requirenent,
             * 1. generate id for this requirement
             * 2. add it to the requirements hash
             * 3. add it to the root of the feature structure
             */
            if (!reqId) {
                const newId = getUniqueRequirementId();
                requirements[newId] = [requirement];
                structure[requirement] = newId;
                id = newId;
            }
            else {
                id = reqId;
            }
        }
        else if (requirement instanceof Array) {
            const reqId = findPathId(requirement.map(removeExtraSpaces), structure);
            if (!reqId) {
                console.error(`Coverage record
  ${requirement.join("\n  ")}
cannot be used because this path was registered as a category and a requirement.`);
                return;
            }
            else {
                id = reqId;
            }
        }
        else {
            console.error(`Recorded unsupported type of requirement`, requirement);
            return;
        }
        if (!(id in records)) {
            records[id] = [];
        }
        // store spec record under requirement id
        records[id].push(spec);
    });
    return records;
};
/**
 * Used to merge file-level feature records to global feature
 * @param param0
 * @param param1
 */
const mergeFeatureRecords = ({ records: source }, { records: target }) => {
    Object.entries(source).forEach(([requirementId, specs]) => {
        if (requirementId in target) {
            target[requirementId] = [...target[requirementId], ...specs];
        }
        else {
            target[requirementId] = [...specs];
        }
    });
};

const readCoverageReportFile = async (filePath) => {
    const data = await fs.readFile(filePath, { encoding: "utf-8" });
    return JSON.parse(data);
};
const getGlobalFeatureName = ({ group, title, }) => `${group}-/-${title}`;
const lookupForFeatures = (filePath, featureList, globalFeatures = {}) => {
    const features = featureList.map((source) => {
        let global = {};

        const feature = {
            id: getGlobalFeatureName(source),
            title: removeExtraSpaces(source.title || ""),
            description: removeExtraSpaces(source.description || ""),
            group: removeExtraSpaces(source.group || ""),
            records: {},
            files: {},
            get global() {
                return global;
            },
            get structure() {
                return global.structure;
            },
            get depth() {
                return global.depth;
            },
        };
        seedStructure(source.structure);
        global = globalFeatures[feature.id];
        if (global) {
            global.description = global.description || feature.description;
            mergeFeatureStructure(feature.title, source.structure, global.structure);
        }
        else {
            global = {
                ...feature,
                structure: source.structure,
                depth: 1,
            };
            globalFeatures[feature.id] = global;
        }
        feature.records = convertRecordsListToMap(source.records, global.structure);
        // do this later while normalising projects
        //setSpecsUnique(feature.records);
        mergeFeatureRecords(feature, global);
        global.files[filePath] = feature.records;
        features.push(feature);
        // feature also gets one file records just to match global feature shape for easier processing
        feature.files = { [filePath]: feature.records };
        return feature;
    });
    return features;
};
const readFeatures = async (filePath, globalFeatures) => {
    const records = await readCoverageReportFile(filePath);
    const features = lookupForFeatures(filePath, records, globalFeatures);
    return features;
};

const readFiles = async (dirPath, files, features) => {
    for (let index = 0; index < files.length; index++) {
        const file = files[index];
        file.specName = path.basename(file.name, ".json");
        file.path = path.resolve(dirPath, file.name);
        file.features = await readFeatures(file.path, features);
    }
    return files;
};
const readDirectories = async (list, features) => {
    for (let dir of list) {
        await readFiles(dir.path, dir.files, features);
    }
};
const collectFiles = (roots) => {
    const files = {};
    roots.forEach(({ root, list }) => list.forEach((dir) => {
        dir.files.forEach((file) => {
            const id = path.join(root.name, dir.localPath, file.name);
            file.id = id;
            files[id] = file;
        });
    }));
    return files;
};
const readCoverage = async (paths, features = {}) => {
    const roots = await readAll(paths);
    for (let item of roots) {
        const { list } = item;
        await readDirectories(list, features);
    }
    const files = collectFiles(roots);
    return { roots, features, files };
};

exports.readCoverage = readCoverage;
