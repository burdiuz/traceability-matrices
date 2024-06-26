import path from "node:path";
import fs from "node:fs/promises";
import { DirectoryInfo } from "./types";

export type ReadResult = { root: DirectoryInfo; list: DirectoryInfo[] };

const FEATURE_DIR = ".$features";

const readDirectory = async (
  rootPath: string,
  dirPath: string,
  list: DirectoryInfo[] = []
) => {
  const name = path.basename(dirPath);
  const contents = await fs.readdir(dirPath);

  const directory: DirectoryInfo = {
    path: dirPath,
    localPath: dirPath.substr(rootPath.length + 1),
    name,
    hidden: name === FEATURE_DIR,
    hasFiles: false,
    hasFilesDeep: false,
    children: [],
    files: [],
  };

  for (let value of contents) {
    if (value.charAt(0) === "." && value !== FEATURE_DIR) {
      continue;
    }

    const valuePath = path.resolve(dirPath, value);
    const stat = await fs.stat(valuePath);

    if (stat.isDirectory()) {
      const { directory: child } = await readDirectory(
        rootPath,
        valuePath,
        list
      );

      directory.children.push(child);

      if (child.hasFilesDeep) {
        directory.hasFilesDeep = true;
        list.push(child);
      }
    } else if (stat.isFile() && path.extname(value) === ".json") {
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

const sortDirList = (list: DirectoryInfo[]) =>
  list.sort(({ path: a }, { path: b }) => (a < b ? -1 : 1));

export const read = async (root: string): Promise<ReadResult> => {
  const list = [];

  const { directory } = await readDirectory(root, root, list);

  return {
    root: directory,
    list: sortDirList(list),
  };
};

export const readAll = async (paths: string[]) => {
  const data: ReadResult[] = [];

  for (let root of paths) {
    const result = await read(root);
    data.push(result);
  }

  return data.sort(({ root: { path: a } }, { root: { path: b } }) =>
    a < b ? -1 : 1
  );
};
