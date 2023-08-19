const { readCoverage } = require("./reader/reader");

const generateStatic = async (targetDirs, outputDir) => {
  let state = await readCoverage(targetDirs);
};

module.exports.generateStatic;
