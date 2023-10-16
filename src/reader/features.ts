import { readFile } from "node:fs/promises";
import { Feature, FeatureFileJSON, GlobalFeature } from "./types";
import { removeExtraSpaces } from "./utils";
import { seedStructure } from "./structure";

const readCoverageReportFile = async (filePath: string) => {
  const data = await readFile(filePath, { encoding: "utf-8" });

  return JSON.parse(data) as FeatureFileJSON;
};

const getGlobalFeatureName = ({ group, title }) => `${group}-/-${title}`;

const lookupForFeatures = (
  filePath: string,
  featureList: FeatureFileJSON,
  globalFeatures: Record<string, GlobalFeature> = {}
) => {
  const features: Feature[] = [];

  featureList.forEach((source) => {
    let global: GlobalFeature;

    const feature: Feature = {
      id: getGlobalFeatureName(source),
      title: removeExtraSpaces(source.title || ""),
      description: removeExtraSpaces(source.description || ""),
      group: removeExtraSpaces(source.group || ""),
      records: {},
      files: {},
      get global() {
        return global;
      },
      get structure() {
        return global.structure;
      },
      get depth() {
        return global.depth;
      },
    };

    seedStructure(source.structure);
    global = globalFeatures[feature.id];

    if (global) {
      global.description = global.description || feature.description;
      mergeFeatureStructure(feature.title, source.structure, global.structure);
    } else {
      global = {
        ...feature,
        structure: source.structure,
        depth: 1,
      };

      globalFeatures[feature.id] = global;
    }

    feature.records = convertRecordsListToMap(source.records, global.structure);

    setSpecsUnique(feature.records);

    mergeFeatureRecords(feature, global);
    global.files[filePath] = feature.records;
    features.push(feature);

    // feature also gets one file records just to match global feature shape for easier processing
    feature.files = { [filePath]: feature.records };
  });

  return features;
};

export const readRecords = async (
  filePath: string,
  globalFeatures: Record<string, GlobalFeature>
) => {
  const records = await readCoverageReportFile(filePath);
  // const specFile = filePath.replace(/\.json$/, "");

  const features = lookupForFeatures(filePath, records, globalFeatures);

  //console.log(features[0].structure['Grand requirement']);
  /*
  console.log(
    features[0].requirements['PRD Requirement 3'].specs[0]
      .requirements
  );
  */

  return features;
};
