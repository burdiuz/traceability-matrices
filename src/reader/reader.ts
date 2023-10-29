import { resolve, join, basename } from "node:path";
import { type ReadResult, readAll } from "./file-structure";
import { FileInfo, type GlobalFeature, DirectoryInfo, Feature } from "./types";
import { readFeatures } from "./features";
import { setSpecsUnique } from "./records";
import { clearSpecsCache } from "./specs";
import { getStructureRequirements } from "./structure";

export type Coverage = {
  roots: ReadResult[];
  features: Record<string, GlobalFeature>;
  files: Record<string, FileInfo>;
};

const readFiles = async (
  dirPath: string,
  files: FileInfo[],
  features: Record<string, GlobalFeature>
) => {
  for (let index = 0; index < files.length; index++) {
    const file = files[index];

    file.specName = basename(file.name, ".json");
    file.path = resolve(dirPath, file.name);

    file.features = await readFeatures(file.path, features);
  }

  return files;
};

const readDirectories = async (
  list: DirectoryInfo[],
  features: Record<string, GlobalFeature>
) => {
  for (let dir of list) {
    await readFiles(dir.path, dir.files, features);
  }
};

const collectFiles = (roots: ReadResult[]) => {
  const files: Record<string, FileInfo> = {};

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

const getStructureDepth = (structure: object, depth = 1) => {
  let newDepth = depth;

  for (let key in structure) {
    const value = structure[key];

    if (value && typeof value === "object") {
      newDepth = Math.max(newDepth, getStructureDepth(value, depth + 1));
    }
  }

  return newDepth;
};

const fillEmptyRecords = (feature: Feature) => {
  const requirements = getStructureRequirements(feature.structure);

  Object.keys(requirements).forEach((id) => {
    if (!feature.records[id]) {
      feature.records[id] = [];
    }
  });
};

/**
 * Remove duplicate specs from records
 * Add not coverred requirements to records with empty specs list
 */
const normalize = (
  globalFeatures: Record<string, GlobalFeature>,
  files: Record<string, FileInfo>
) => {
  Object.values(globalFeatures).forEach((feature) => {
    // calculate each global project depth
    feature.depth = getStructureDepth(feature.structure);

    // filter specs for global features to remove duplicate spec records for each requirement
    setSpecsUnique(feature.records);

    // add empty records for not tested requirements
    fillEmptyRecords(feature);
  });

  Object.values(files).forEach((file) =>
    file.features.forEach((feature) => {
      // filter specs for global features to remove duplicate spec records for each requirement
      setSpecsUnique(feature.records);

      // add empty records for not tested requirements
      fillEmptyRecords(feature);
    })
  );
};

export const readCoverage = async (
  paths: string[],
  features: Record<string, GlobalFeature> = {}
): Promise<Coverage> => {
  clearSpecsCache();
  const roots = await readAll(paths);

  for (let item of roots) {
    const { list } = item;

    await readDirectories(list, features);
  }

  const files = collectFiles(roots);

  normalize(features, files);

  return { roots, features, files };
};
