import { readFile } from "node:fs/promises";
import type { FeatureFileJSON, GlobalFeature, LocalFeature } from "./types";
import { removeExtraSpaces } from "./utils";
import { convertRecordsListToMap, mergeFeatureRecords } from "./records";
import { seedStructure, mergeFeatureStructure } from "./structure";

const readCoverageReportFile = async (filePath: string) => {
  const data = await readFile(filePath, { encoding: "utf-8" });

  return JSON.parse(data) as FeatureFileJSON;
};

export const getGlobalFeatureId = ({
  group,
  title,
}: {
  title: string;
  group: string;
}) => `${group}-/-${title}`;

const lookupForFeatures = (
  filePath: string,
  featureList: FeatureFileJSON,
  globalFeatures: Record<string, GlobalFeature> = {}
) =>
  featureList.map((source) => {
    let global: GlobalFeature;
    const partial = {
      id: getGlobalFeatureId(source),
      title: removeExtraSpaces(source.title || ""),
      description: removeExtraSpaces(source.description || ""),
      group: removeExtraSpaces(source.group || ""),
      headers: source.headers,
      records: {},
      files: {},
    };

    const feature: LocalFeature = {
      ...partial,
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
        ...partial,
        structure: source.structure,
        depth: 1,
      };

      globalFeatures[feature.id] = global;
    }

    feature.records = convertRecordsListToMap(source.records, global.structure);

    // do this later while normalising projects
    //setSpecsUnique(feature.records);

    mergeFeatureRecords(feature, global);
    global.files[filePath] = feature.records;

    // feature also gets one file records just to match global feature shape for easier processing
    feature.files = { [filePath]: feature.records };

    return feature;
  });

export const readFeatures = async (
  filePath: string,
  globalFeatures: Record<string, GlobalFeature>
) => {
  const records = await readCoverageReportFile(filePath);

  const features = lookupForFeatures(filePath, records, globalFeatures);

  return features;
};
