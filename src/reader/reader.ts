import { resolve, join, basename } from "node:path";
import { type ReadResult, readAll } from "./file-structure";
import {
  FileInfo,
  type Feature,
  type GlobalFeature,
  DirectoryInfo,
} from "./types";
import { readFeatures } from "./features";
import { setSpecsUnique } from "./records";

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

/**
 * Remove duplicate specs from
 * @param {Record<string, import("./coverage-records").>} globalFeatures
 * @param {Record<string, import("./reader").FileWithFeatures>} files
 */
const normalize = (
  globalFeatures: Record<string, GlobalFeature>,
  files: Record<string, FileInfo>
) => {
  // set unique specs for global features
  //setSpecsUnique()
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
