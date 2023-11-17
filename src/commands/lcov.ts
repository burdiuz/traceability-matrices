import { join, relative } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { type Coverage, type Feature, readCoverage } from "../reader/index";
import { type VerticalInfo, buildVerticalHeaders } from "../view/feature";

const stripTags = (text: string) =>
  text.replace(/[,\r\n\s]+/gi, " ").replace(/<\/?a-z[^>]+>/gi, "");

const generateFeatureLcovContent = (
  feature: Feature,
  relativeDir: string,
  info: VerticalInfo = buildVerticalHeaders(feature)
) => {
  let lineNumber = 2;
  let blockNumber = 1;
  const fileName = `${feature.group}_${feature.title}.md`.replace(
    /([^0-9a-z_().,\- ]+|[\\\/,\r\n\t\v]+)/gi,
    "_"
  );

  // test name
  const tn = (
    feature.group ? `${feature.group}: ${feature.title}` : feature.title
  ).replace(/[\r\n\s]+/gi, " ");
  // file name
  const sf = join(relativeDir, "lcov", fileName);
  const content = ["/*", `# ${tn}`];

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
  const da = []; // [`DA:${info.requirementsCovered},${lineNumber}`]; -- cover feature title
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
      da.push(`DA:${cell.requirementsCovered},${lineNumber}`);
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
    content: [...content, "", "*/", ""].join("\n"),
  };
};

/**
 * renders coverage information into LCOV file
 */
export const readCoverageStats = (
  { features }: Coverage,
  relativeDir: string
) => {
  const list = Object.values(features);
  let lcov = "";
  const files: Record<string, string> = {};

  list.forEach((feature) => {
    const data = generateFeatureLcovContent(feature, relativeDir);
    lcov += `${data.lcov}\n`;
    files[data.fileName] = data.content;
  });

  return { lcov, files };
};

export const lcov = async (
  targetDirs: string[],
  outputDir: string,
  relativeDir?: string
) => {
  const state = await readCoverage(targetDirs);

  const { lcov, files } = readCoverageStats(
    state,
    relativeDir === undefined ? outputDir : relativeDir
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
