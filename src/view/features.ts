import { compile } from "pug";
import { calculateFeatureStats } from "./totals";
import { renderFeatureCategoryList } from "./feature";
import { Coverage } from "../reader";
import { PageLinks } from "./types";

const featuresStructureTemplate = compile(
  `
div.flex-vertical
  each feature in self.list
    div(class= feature.covered ? 'feature-link covered' : 'feature-link')
      div.feature-info
        button.toggle-feature-categories(onClick='handleFeatureCategoriesToggleVisibility(this.parentElement.parentElement);', title='Show feature categories')
          include /icons/bars-staggered-solid.svg
        button.toggle-feature-files(onClick='handleFeatureFilesToggleVisibility(this.parentElement.parentElement)', title='Show files where feature related specs are present')
          include /icons/file-lines-solid.svg
        span.totals #{feature.requirementsCovered} / #{feature.requirementsTotal}
        a.title(href=self.links.getFeatureLink(feature.title)) #{feature.title}
      | !{feature.renderCategories()}
      ul.feature-files-list
        each file in feature.files
          li
            a(href=self.links.getFileLink(file.path)) #{file.name}
            span  (#{file.requirementsCovered} / #{file.requirementsTotal})  
`,
  { self: true, filename: "pug", basedir: __dirname }
);

export const renderFeatures = (state: Coverage, links: PageLinks) => {
  const filePaths = Object.values(state.files).reduce(
    (res, file) => ({
      ...res,
      [file.path]: file,
    }),
    {}
  );

  const list = Object.values(state.features).map((feature) => {
    const stats = calculateFeatureStats(feature);

    return {
      title: feature.title,
      files: Object.entries(feature.files).map(([path, requirements]) => {
        const { total, covered } = Object.values(requirements).reduce(
          ({ total, covered }, specs) => ({
            total: total + 1,
            covered: covered + (specs.length ? 1 : 0),
          }),
          { total: 0, covered: 0 }
        );
        return {
          path: filePaths[path].id,
          name: filePaths[path].specName,
          requirementsTotal: total,
          requirementsCovered: covered,
        };
      }),
      renderCategories: () => renderFeatureCategoryList(feature, state, links),
      ...stats,
    };
  });

  return featuresStructureTemplate({
    list,
    links,
  });
};
