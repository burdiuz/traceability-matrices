import { existsSync } from "node:fs";
import {
  readFile,
  writeFile,
  readdir,
  stat,
  access,
  constants,
  mkdir,
} from "node:fs/promises";
import { resolve, extname, relative, join } from "node:path";

const FORMATS: Record<
  string,
  () => Promise<
    (
      content: string
    ) => Promise<
      object & { title: String; group: string; }
    >
  >
> = {
  // TODO replace with package path @actualwave/traceability-matrices/****.js
  html: async () => {
    const { parseHtmlFeature } = await import("./parsers/html.js");

    return parseHtmlFeature;
  },
  json: async () => {
    const { parseJsonFeature } = await import("./parsers/json.js");
    return parseJsonFeature;
  },
  markdown: async () => {
    const { parseMarkdownFeature } = await import("./parsers/markdown.js");
    return parseMarkdownFeature;
  },
  xml: async () => {
    const { parseXmlFeature } = await import("./parsers/xml.js");
    return parseXmlFeature;
  },
  yaml: async () => {
    const { parseYamlFeature } = await import("./parsers/yaml.js");
    return parseYamlFeature;
  },
};

export const scanFeatures = async (
  featureDirs: string[],
  targetDir: string
) => {
  for (let path of featureDirs) {
    await readFeatureDir(path, path, targetDir);
    /*
    scan path for features and directories, scan sub-directories recursively,
    generate feature coverage report(it will contain only feature structure with 0 coverage)
    store it in a coverage reports filder under
    */
  }
};

const readFeatureDir = async (
  dirPath: string,
  basePath: string,
  targetDir: string
) => {
  const contents = await readdir(dirPath);

  for (let name of contents) {
    if (name.charAt(0) === ".") {
      continue;
    }

    const path = resolve(dirPath, name);
    const info = await stat(path);

    if (info.isDirectory()) {
      await readFeatureDir(path, basePath, targetDir);
    } else if (info.isFile()) {
      await parseFeature(path, basePath, targetDir);
    }
  }
};

const getFeatureParser = async (path: string) => {
  const ext = extname(path).toLowerCase();
  switch (ext) {
    case ".html":
    case ".htm":
      return FORMATS.html();
    case ".json":
      return FORMATS.json();
    case ".md":
    case ".markdown":
      return FORMATS.markdown();
    case ".xml":
      return FORMATS.xml();
    case ".yaml":
    case ".yml":
      return FORMATS.yaml();
  }

  return null;
};

const parseFeature = async (
  path: string,
  basePath: string,
  targetDir: string
) => {
  const parser = await getFeatureParser(path);

  if (!parser) {
    console.log(`Can't find parser for a file:\n  ${path}`);
    return;
  }

  try {
    await access(path, constants.R_OK);
  } catch (err) {
    console.log(`Can't read file:\n  ${path}`);
  }

  const content = await readFile(path, { encoding: "utf-8" });
  const feature = await parser(content);

  const featureDir = join(targetDir, ".$features");

  if (!existsSync(featureDir)) {
    await mkdir(featureDir, { recursive: true });
  }

  const fileName = relative(basePath, path)
    .replace(/^[./\\]+/, "")
    .replace(/[/\\]+/g, "_");

  const filePath = join(featureDir, `${fileName}.json`);

  // TODO verify if it doesn't save current feature with all previous because of global features object
  await writeFile(filePath, JSON.stringify([feature], null, 2));

  console.log(
    `Feature recorded: ${
      feature.group ? `${feature.group}/${feature.title}` : feature.title
    }`
  );
};

// A stub for Cypress after() hook which is used in src/cypress to save coverage recordings
// it is being called on initialisation
global.after = () => {};
