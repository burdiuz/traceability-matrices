import { compile } from "pug";
import { calculateFeatureStats } from "./totals";
import type { Coverage, FileInfo } from "../reader";
import type { PageLinks } from "./types";

const fileStructureTemplate = compile(
  `
div.flex-vertical
  each result in self.roots
    div.dir-root #{result.root.name}
    each dir in result.list
      if dir.files.length && !dir.hidden
        div.directory
          div.dir-path #{dir.localPath}
          each file in dir.files
            div.file
              a(href=self.links.getFileLink(file.id)) #{file.specName}
              div.file-features
                each feature in self.listFileFeatures(file)
                  span.file-feature(title=\`File coverage: \${feature.coverage}%\\nCovered requirements: \${feature.requirementsCovered}\\nTotal requirements: \${feature.requirementsTotal}\`) #{feature.title}

`,
  { self: true }
);

export const renderFiles = (state: Coverage, links: PageLinks) => {
  return fileStructureTemplate({
    ...state,
    links,

    // TODO CACHE totals per file and feature
    listFileFeatures: (file: FileInfo) =>
      Object.values(file.features).map((feature) => {
        const totals = calculateFeatureStats(feature);

        return {
          title: feature.title,
          ...totals,
        };
      }),
  });
};
