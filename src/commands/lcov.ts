import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { type Coverage, type Feature, readCoverage } from "../reader/index";
import { type VerticalInfo, buildVerticalHeaders } from "../view/feature";

const stripTags = (text: string) =>
  text.replace(/[,\r\n\s]+/gi, " ").replace(/<\/?a-z[^>]+>/gi, "");

const generateFileName = (feature: Feature, format?: string) => {
  const fileName = `${feature.group}_${feature.title}`.replace(
    /([^0-9a-z_().,\- ]+|[\\\/,\r\n\t\v]+)/gi,
    "_"
  );

  switch (format) {
    case "md":
      return `${fileName}.md`;
    case "js":
    default:
      return `${fileName}.js`;
  }
};

const generateOpening = (format?: string) => {
  switch (format) {
    case "md":
      return "/*";
    case "js":
    default:
      return "export default {/*";
  }
};

const generateEnding = (format?: string) => {
  switch (format) {
    case "md":
      return "*/";
    case "js":
    default:
      return "*/};";
  }
};

/*
TN:<test name> usually empty
SF:<absolute path to the source file>
FN:<line number of function start>,<function name>
FNDA:<execution count>,<function name>
FNF:<number of functions found>
FNH:<number of function hit>
BRDA:<line number>,<block number>,<branch number>,<taken>
BRF:<number of branches found>
BRH:<number of branches hit>
DA:<line number>,<execution count>
LH:<number of lines with a non-zero execution count>
LF:<number of instrumented lines>
end_of_record

 Reference https://xujihui1985.github.io/test/2015/10/06/lcovinfo
 */
const generateFeatureLcovContent = (
  feature: Feature,
  relativeDir: string,
  format?: string,
  info: VerticalInfo = buildVerticalHeaders(feature)
) => {
  let lineNumber = 2;
  let blockNumber = 1;
  const fileName = generateFileName(feature, format);

  // test name
  const tn = (
    feature.group ? `${feature.group}: ${feature.title}` : feature.title
  ).replace(/[\r\n\s]+/gi, " ");
  // file name
  const sf = join(relativeDir, "lcov", fileName);
  const content = [generateOpening(format), `# ${tn}`];

  // functions -- high level categories
  const fn = []; // [`FN:${lineNumber},${tn}`]; -- add feature title to coverage as function
  const fnda = []; // [`FNDA:${info.requirementsCovered},${tn}`]; -- cover feature title
  let fnh = info.requirementsCovered ? 1 : 0;

  // blocks, branches -- only requirements
  const brda = []; /*[
    `BRDA:${lineNumber},${blockNumber},${blockNumber},${
      info.requirementsCovered ? info.requirementsCovered : "-"
    }`,
  ] -- cover feature title */
  let brh = info.requirementsCovered ? 1 : 0;

  // lines -- only requirements
  const da = []; // [`DA:${lineNumber},${info.requirementsCovered}`]; -- cover feature title
  let lh = info.requirementsCovered ? 1 : 0;

  info.rows.forEach((row) => {
    row.forEach((cell) => {
      lineNumber++;
      content[lineNumber - 1] = `${" ".repeat(cell.depth * 2)}- ${cell.title}`;

      if (cell.category) {
        // function
        const name = stripTags(cell.title);
        fn.push(`FN:${lineNumber},${name}`);
        fnda.push(`FNDA:${cell.requirementsCovered},${name}`);
        fnh += cell.requirementsCovered ? 1 : 0;
        return;
      }

      // block
      blockNumber++;
      brda.push(
        `BRDA:${lineNumber},${blockNumber},${blockNumber},${
          cell.requirementsCovered ? cell.requirementsCovered : "-"
        }`
      );
      brh += cell.requirementsCovered ? 1 : 0;

      // line
      da.push(`DA:${lineNumber},${cell.requirementsCovered}`);
      lh += cell.requirementsCovered ? 1 : 0;
    });
  });

  return {
    lcov: `TN:${tn}
SF:${sf}
${fn.join("\n")}
${fnda.join("\n")}
FNF:${fn.length}
FNH:${fnh}

${brda.join("\n")}
BRF:${brda.length}
BRH:${brh}

${da.join("\n")}
LF:${da.length}
LH:${lh}
end_of_record
`,
    path: sf,
    fileName,
    content: [...content, "", generateEnding(format), ""].join("\n"),
  };
};

/**
 * renders coverage information into LCOV file
 */
export const readCoverageStats = (
  { features }: Coverage,
  relativeDir: string,
  format?: string
) => {
  const list = Object.values(features);
  let lcov = "";
  const files: Record<string, string> = {};

  list.forEach((feature) => {
    const data = generateFeatureLcovContent(feature, relativeDir, format);
    lcov += `${data.lcov}\n`;
    files[data.fileName] = data.content;
  });

  return { lcov, files };
};

export const lcov = async (
  targetDirs: string[],
  outputDir: string,
  relativeDir?: string,
  format?: string
) => {
  const state = await readCoverage(targetDirs);

  const { lcov, files } = readCoverageStats(
    state,
    relativeDir === undefined ? outputDir : relativeDir,
    format
  );

  // write lcov info
  await writeFile(join(outputDir, "lcov.info"), lcov, { encoding: "utf-8" });

  const contentDir = join(outputDir, "lcov");

  if (!existsSync(contentDir)) {
    mkdirSync(contentDir);
  }

  const list = Object.entries(files);

  for (let index = 0; index < list.length; index++) {
    const [fileName, content] = list[index];

    await writeFile(join(outputDir, "lcov", fileName), content, {
      encoding: "utf-8",
    });
  }
};
