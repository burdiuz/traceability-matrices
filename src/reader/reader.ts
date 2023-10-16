import { resolve, join, basename } from "node:path";
import { type ReadResult, readAll } from "./file-structure";
import {
  type Feature,
  type GlobalFeature,
  readRecords,
} from "./features";

export type FileInfo = {
  id: string;
  name: string;
  specName: string;
  path: string;
  features: Feature[];
};

const readFiles = async (
  dirPath: string,
  files: string[],
  features: Record<string, GlobalFeature>
) => {
  const fileObjects: FileInfo[] = [];

  for (let index = 0; index < files.length; index++) {
    const fileName = files[index];
    const filePath = resolve(dirPath, fileName);

    const fileFeatures = await readRecords(filePath, features);

    fileObjects.push({
      id: "",
      name: fileName,
      specName: basename(fileName, ".json"),
      path: filePath,
      features: fileFeatures,
    });
  }

  return fileObjects;
};

const readDirectories = async (
  list,
  features: Record<string, GlobalFeature>
) => {
  for (let dir of list) {
    await readFiles(dir.path, dir.files, features);
  }
};

const collectFiles = (roots: ReadResult[]) => {
  const files = {};

  roots.forEach(({ root, list }) =>
    list.forEach((dir) => {
      dir.files.forEach((file) => {
        const id = join(root.name, dir.localPath, file.name);
        file.id = id;
        files[id] = file;
      });
    })
  );

  return files;
};

const getStructureDepth = (structure, depth = 0) => {
  let newDepth = depth;

  for (key in structure) {
    const value = structure[key];

    if (value && typeof value === "object") {
      newDepth = Math.max(newDepth, getStructureDepth(value, depth + 1));
    }
  }

  return newDepth;
};

/**
 * Adds empty recorts for requirements found in structure and not presdent in records
 * Adds requiremnts to structure which were tested(present in records) but aren't presented there.
 * @param {Record<string, import("./coverage-records").>} globalFeatures
 * @param {Record<string, import("./reader").FileWithFeatures>} files
 */
const normalize = (globalFeatures: Record<string, GlobalFeature>, files) => {
  // generate missing structure pieces from records
  Object.values(globalFeatures).forEach((feature) => {
    const structReqs = getStructureLeafNodes(feature.structure);
    Object.keys(feature.records).forEach((req) => {
      if (structReqs.indexOf(req) < 0) {
        feature.structure[req] = {};
      }
    });
  });

  // add empty records from structure for global features
  Object.values(globalFeatures).forEach((feature) => {
    const { structure, records } = feature;

    addEmptyRecordsFromStructure(structure, records);

    // calculate structure depth of the feature
    feature.depth = getStructureDepth(feature.structure);
  });

  // add empty records from requirements found in structure for partial features
  Object.values(files).forEach(({ features }) =>
    Object.values(features).forEach(({ global, records, depth, title }) => {
      addEmptyRecordsFromStructure(global.structure, records);
    })
  );
};

export const readCoverage = async (
  paths: string[],
  features: Record<string, GlobalFeature> = {}
) => {
  const roots = await readAll(paths);

  for (let item of roots) {
    const { list } = item;

    await readDirectories(list, features);
  }

  const files = collectFiles(roots);

  normalize(features, files);

  return { roots, features, files };
};
