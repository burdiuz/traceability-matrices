const { compile } = require("pug");
const { resolve } = require("path");
const { read } = require("../reader/file-structure.js");

const fileStructureTemplate = compile(`
each dir in list
  div.directory
    div.dir-path #{dir.localPath}
    each file in dir.files
      div.file
        a(href=\`/file?dir=\${dir.path}&name=\${file}\`) #{file}
`);

(async () => {
  const path = resolve("./cypress_coverage");
  const structure = await read(path);
  const list = structure.list
    .filter(({ hasFiles }) => hasFiles);

  console.log(list);
  console.log(
    fileStructureTemplate({
      list,
    })
  );
})();
