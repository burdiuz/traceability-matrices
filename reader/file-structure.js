const path = require("path");
const fs = require("fs/promises");

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
    if (value.charAt(0) === ".") continue;
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
      directory.files.push(value);
    }
  }

  return { directory, list };
};

const sortDirList = (list) =>
  list
    // .filter(({ hasFilesDeep }) => hasFilesDeep)
    .sort(({ path: a }, { path: b }) => (a < b ? -1 : 1));

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

  return data.sort(([{ path: a }], [{ path: b }]) => (a < b ? -1 : 1));
};

module.exports.read = read;
module.exports.readAll = readAll;
