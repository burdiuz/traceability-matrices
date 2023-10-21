import { Coverage, FileInfo } from "../reader";
import { renderFeature } from "./feature";
import { PageLinks } from "./types";

export const renderFile = (
  file: FileInfo,
  state: Coverage,
  links: PageLinks,
  featureTableType: "default" | "compact"
) => {
  const list = Object.values(file.features).map((source) => {
    return renderFeature(source, state, links, featureTableType);
  });

  return list.join("");
};
