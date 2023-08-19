const { resolve, join, basename } = require("path");
const { readAll } = require("./file-structure");
const { readRecords } = require("./coverage-records");

const readFiles = async (dirPath, files, projects) => {
  for (let index = 0; index < files.length; index++) {
    const fileName = files[index];
    const filePath = resolve(dirPath, fileName);

    const fileProjects = await readRecords(filePath, projects);

    files[index] = {
      name: fileName,
      specName: basename(fileName, ".json"),
      path: filePath,
      projects: fileProjects,
    };
  }
};

const readDirectories = async (list, projects) => {
  for (let dir of list) {
    await readFiles(dir.path, dir.files, projects);
  }
};

const collectFiles = (roots) => {
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

const readCoverage = async (paths, projects = {}) => {
  const roots = await readAll(paths);

  for (item of roots) {
    const { list } = item;

    await readDirectories(list, projects);
  }

  return { roots, projects, files: collectFiles(roots) };
};

module.exports.readCoverage = readCoverage;
