import { FeatureRecord } from "./types";

let specs = {};

export type Spec = Omit<FeatureRecord, "requirement"> & { id: string };

export const getSpecId = ({
  filePath,
  titlePath,
}: {
  filePath: string;
  titlePath: string[];
}) => {
  return `${filePath}#${titlePath.join("/")}`;
};

/**
 * Convert spec data read from JSON is converted to an object with ratio 1:1 to specs in test file.
 * So, each real spec from test file is represented by one spec object in Coverage state and they 
 * can be matched by reference.
 */
export const getSpec = (record: FeatureRecord): Spec => {
  const id = getSpecId(record);

  if (specs[id]) {
    return specs[id];
  }

  const { title, titlePath, filePath } = record;
  const spec = {
    id,
    title,
    titlePath,
    filePath,
  };

  specs[id] = spec;

  return spec;
};

export const clearSpecsCache = () => {
  specs = {};
};
