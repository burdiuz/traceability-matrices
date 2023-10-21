import { basename } from "node:path";
import { compile } from "pug";
import type { Coverage, Feature, FeatureRecord, FileInfo } from "../reader";
import type { PageLinks } from "./types";

// at this point all requirements were assigned unique IDs, so they are all strings
const isRequirementValue = (val: unknown): val is string =>
  typeof val === "string";

const featureTableTemplate = compile(
  `
table.feature

  if self.featureDescription
    tr
      td.feature-description(colspan=self.requirementsDepth + self.totalSpecCount + 1) !{self.featureDescription}

  //- Header Rows
  tr.file-headers
    th.feature-title(colspan=self.requirementsDepth, rowspan=self.featureHeaders.length ? 1 : 2) #{self.featureTitle} (#{self.coveredRequirements} / #{self.totalRequirements})
    th.spec-count(rowspan='2') Spec count
    each file in self.fileHeaders
      th.file-name(colspan=file.colspan, title=file.title)
        a(href=self.links.getFileLink(file.path)) #{file.name}
  tr.specs-headers
    if self.featureHeaders.length
      - var index = 0;
      while index < self.requirementsDepth
        th.header(title=self.featureHeaders[index]) #{self.featureHeaders[index]}
        - index++;
    each spec in self.specHeaders
      th.spec-name(title=spec.title)
        span.spec-name-text #{spec.name}

  //- Data Rows
  each row, index in self.dataRows
    tr(class=\`result \${row.class}\`)
      each header in self.dataHeaderRows[index]
        th(colspan=header.colspan, rowspan=header.rowspan, class=\`requirement \${header.class || ''}\`, title=header.title)
          if header.category
            a.requirement-text(id=header.id, name=header.id) !{header.name}  
              span.category-coverage (#{header.requirementsCovered} / #{header.requirementsTotal})
          else
            span.requirement-text !{header.name}
      each data in row.cells
        td(title=data.title, class=\`cell \${data.class || ''}\`) 
          span.cell-text #{data.name}

  //- Totals
  tr.totals
    td(colspan=self.requirementsDepth) Feature Coverage
    td(colspan=self.totalSpecCount + 1) #{self.coveredRequirements} / #{self.totalRequirements}
`,
  { self: true, filename: "pug", basedir: __dirname }
);

const featureCompactTemplate = compile(
  `
table.feature.compact

  if self.featureDescription
    tr
      td.feature-description(colspan=self.totalSpecCount + 2) !{self.featureDescription}

  //- Header Rows
  tr.file-headers
    th.feature-title(colspan=1, rowspan=self.featureHeaders.length ? 1 : 2) #{self.featureTitle} (#{self.coveredRequirements} / #{self.totalRequirements})
    th.spec-count(rowspan='2') Spec count
    each file in self.fileHeaders
      th.file-name(colspan=file.colspan, title=file.title) 
        a(href=self.links.getFileLink(file.path)) #{file.name}
  tr.specs-headers
    if self.featureHeaders.length
      - var header = self.featureHeaders[self.featureHeaders.length - 1];
      th.header(title=header) #{header}
    each spec in self.specHeaders
      th.spec-name(title=spec.title)
        span.spec-name-text #{spec.name}

  //- Data Rows
  each row, index in self.dataRows
    - var dataHeaderCols = self.dataHeaderRows[index];
    each dataHeader, headerIndex in dataHeaderCols
      if headerIndex < dataHeaderCols.length - 1
        tr.category-row(data-level=dataHeader.depth)
          th(colspan=self.totalSpecCount + 2, class=\`category category-level-\${dataHeader.depth} \${dataHeader.class || ''}\`, title=dataHeader.title)
            button.toggle-visibility.collapse(onClick='handleCompactCategoryCollapse(this.parentElement.parentElement)', title='Collapse category')
              include /icons/chevron-down-solid.svg
            button.toggle-visibility.expand(onClick='handleCompactCategoryExpand(this.parentElement.parentElement)', title='Expand category')
              include /icons/chevron-up-solid.svg
            a.category-text(id=dataHeader.id, name=dataHeader.id) !{dataHeader.name} (#{dataHeader.requirementsCovered} / #{dataHeader.requirementsTotal})
      else
        tr(class=\`result \${row.class}\`, data-level=dataHeader.depth)
          th(colspan=1, rowspan=1, class=\`requirement requirement-compact requirement-level-\${dataHeader.depth} \${dataHeader.class || ''}\`, title=dataHeader.title)
            span.requirement-text !{dataHeader.name}
          each data in row.cells
            td(title=data.title, class=\`cell \${data.class || ''}\`) 
              span.cell-text #{data.name}

  //- Totals
  tr.totals
    td Feature Coverage
    td(colspan=self.totalSpecCount + 1) #{self.coveredRequirements} / #{self.totalRequirements}
`,
  { self: true, filename: "pug", basedir: __dirname }
);

const featureCategoriesTemplate = compile(
  `
div.feature-categories
  a(href='', onClick='event.preventDefault(); handleFeatureCategoriesToggleVisibility(this.parentElement)')
    include /icons/bars-staggered-solid.svg
    | Feature Categories
  | !{self.categoriesHtml}
`,
  { self: true, filename: "pug", basedir: __dirname }
);

const featureCategoryListTemplate = compile(
  `
mixin category(list, listClass)
  ul(class=\`category-listing \${listClass}\`)
    each cat in list
      li.category-listing-item
        a(href=\`\${self.categoryLinkBase}#\${cat.id}\`) !{cat.name}
        span       (#{cat.requirementsCovered} / #{cat.requirementsTotal})
        +category(cat.categories, '')

+category(self.categories, 'category-listing-root')
`,
  { self: true, filename: "pug", basedir: __dirname }
);

type FileColumn = {
  path: string;
  name: string;
  title: string;
  colspan: number;
};

type SpecColumn = {
  name: string;
  title: string;
  colspan: number;
};

type HorizontalInfo = {
  specs: FeatureRecord[];
  filesRow: FileColumn[];
  specsRow: SpecColumn[];
  rows: [FileColumn[], SpecColumn[]];
};

export const buildHorizontalHeaders = (
  { files }: Feature,
  globalFiles: Record<string, FileInfo>
): HorizontalInfo => {
  const specs: FeatureRecord[] = [];
  const fileColumns: FileColumn[] = [];
  const specColumns: SpecColumn[] = [];

  const filePaths = Object.values(globalFiles).reduce<Record<string, string>>(
    (res, { path, id }) => ({ ...res, [path]: id }),
    {}
  );

  // [path, records]
  Object.entries(files)
    .map<[{ path: string; name: string }, Record<string, FeatureRecord[]>]>(
      ([path, records]) => [
        { path: filePaths[path], name: basename(path, ".json") },
        records,
      ]
    )
    .sort(([{ name: a }], [{ name: b }]) => (a < b ? -1 : 1))
    .forEach(([{ path, name }, records]) => {
      const fileSpecsObj = Object.values(records).reduce<
        Record<string, FeatureRecord>
      >(
        (result, specs) =>
          specs.reduce((result, spec) => {
            result[spec.titlePath.join("/")] = spec;
            return result;
          }, result),
        {}
      );

      const specList = Object.values(fileSpecsObj);

      if (!specList.length) {
        return;
      }

      // add cell for file names row
      fileColumns.push({
        path,
        name: name,
        // TODO remove cypress coverage path part
        title: name,
        colspan: specList.length,
      });

      specList
        .sort(({ title: a }, { title: b }) => (a < b ? -1 : 1))
        .forEach((spec) => {
          specs.push(spec);
          specColumns.push({
            name: spec.title,
            title: spec.titlePath.join(" > "),
            colspan: 1,
          });
        });
    });

  // a list of specs in indices matching to their cell indices and rows list(first for file names and second for spec names).
  return {
    specs,
    filesRow: fileColumns,
    specsRow: specColumns,
    rows: [fileColumns, specColumns],
  };
};

type RequirmentInfo = {
  title: string;
  id: string;
  specs: FeatureRecord[];
};

type CategoryInfo = {
  title: string;
  children: object;
};

type CellInfo = {
  name: string;
  depth: number;
  id: string;
  category: boolean;
  categories?: CellInfo[];
  requirementsTotal: number;
  requirementsCovered: number;
  class: string;
  title: string;
  colspan: number;
  rowspan: number;
};

type VerticalInfo = {
  requirements: RequirmentInfo[];
  rows: CellInfo[][];
  categories: CellInfo[];
  requirementsCovered: number;
  requirementsTotal: number;
};

/**
 * Go to the leaf nodes of a structure
 * 1. start building from leaf by adding new row
 * 2. leaf node will colspan maxDepth - currentDepth, add leaf requirements into some list to know which row corresponds to which requirement
 * 3. parent nodes will rowspan by count of children
 * 4. after building all nodes returns first row so we know where to add its parent, also inform parent about count of rows
 */
export const buildVerticalHeaders = (feature: Feature): VerticalInfo => {
  const { depth: maxDepth, structure } = feature;

  const buildChildren = (
    children: object,
    categories: CellInfo[] = [],
    depth: number,
    path = ""
  ) => {
    let requirementsTotal = 0;
    let requirementsCovered = 0;
    const childReqs: RequirmentInfo[] = [];
    const childRows: CellInfo[][] = [];

    Object.entries(children)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .forEach(([title, value]) => {
        const child = build(
          isRequirementValue(value)
            ? {
                title,
                id: value,
                specs: feature.records[value] || [],
              }
            : {
                title,
                children: value,
              },
          categories,
          depth,
          path
        );

        requirementsCovered += child.requirementsCovered;
        requirementsTotal += child.requirementsTotal;

        childReqs.push(...child.requirements);
        childRows.push(...child.rows);
      });

    return {
      requirements: childReqs,
      rows: childRows,
      categories,
      requirementsCovered,
      requirementsTotal,
    };
  };

  const build = (
    requirement: RequirmentInfo | CategoryInfo,
    categories: CellInfo[],
    depth: number,
    path = ""
  ) => {
    const cell: CellInfo = {
      name: requirement.title,
      depth,
      id: "",
      class: "",
      category: false,
      requirementsTotal: 0,
      requirementsCovered: 0,

      // if title contains HTML -- strip tags
      title: requirement.title.replace(/<\/?[^>]+?>/gi, ""),
      colspan: 1,
      rowspan: 1,
    };

    if ("children" in requirement) {
      categories.push(cell);
      cell.category = true;
      cell.id = `${path}/${requirement.title.replace(/[^a-z0-9]+/gi, "_")}`;
      const children = buildChildren(
        requirement.children,
        [],
        depth + 1,
        cell.id
      );
      cell.rowspan = children.rows.length;
      cell.class = "category";

      cell.categories = children.categories;
      cell.requirementsCovered = children.requirementsCovered;
      cell.requirementsTotal = children.requirementsTotal;

      children.rows[0].unshift(cell);

      return children;
    } else {
      cell.id = requirement.id;
      cell.colspan = maxDepth - depth;
      cell.requirementsTotal = 1;
      cell.requirementsCovered = requirement.specs.length ? 1 : 0;

      return {
        requirements: [requirement],
        rows: [[cell]],
        requirementsTotal: cell.requirementsTotal,
        requirementsCovered: cell.requirementsCovered,
      };
    }
  };

  return buildChildren(structure, [], 0);
};

const buildDataRows = (vertical: VerticalInfo, horizontal: HorizontalInfo) => {
  const totalSpecCount = horizontal.specs.length;
  const totalRequirements = vertical.rows.length;
  let coveredRequirements = 0;
  const rows = vertical.rows.map((headers, index) => {
    const requirement = vertical.requirements[index];
    const specCount = requirement.specs.length;
    const row = new Array(totalSpecCount + 1).fill({
      name: "",
      title: `Requirement: ${requirement.title}`,
      colspan: 1,
      rowspan: 1,
      class: "empty",
    });

    if (specCount) {
      coveredRequirements++;
    }

    // first column is count of specs used for a requirement
    row[0] = {
      name: specCount,
      title: `${specCount} specs test this requirement`,
      colspan: 1,
      rowspan: 1,
      class: "spec-count",
    };

    requirement.specs.forEach((spec) => {
      const specIndex = horizontal.specs.indexOf(spec);

      if (specIndex < 0) {
        console.error(
          "Spec not found for requirement:",
          requirement.title,
          spec.filePath,
          spec.titlePath
        );

        return;
      }

      row[1 + specIndex] = {
        name: "X",
        title: `Requirement: ${requirement.title}\nSpec: ${spec.titlePath.join(
          " > "
        )}\nFile: ${spec.filePath}`,
        colspan: 1,
        rowspan: 1,
        class: "covered",
      };
    });

    return {
      specCount,
      class: specCount ? "covered" : "empty",
      cells: row,
    };
  });

  return { totalRequirements, coveredRequirements, totalSpecCount, rows };
};

export const renderFeatureCategories = (feature, state, links) => {
  const categoriesHtml = renderFeatureCategoryList(feature, state, links);

  console.log(categoriesHtml);

  return featureCategoriesTemplate({
    categoriesHtml,
  });
};

export const renderFeatureCategoryList = (
  feature,
  state,
  { getFeatureLink }
) => {
  const { categories } = buildVerticalHeaders(feature);

  return featureCategoryListTemplate({
    categories: categories,
    categoryLinkBase: getFeatureLink(feature.title),
  });
};

/**
 *
 * @param {import("../reader/coverage-records").Feature} feature
 * @param {import("../reader/reader").ReadCoverageResult} state
 */
export const renderFeature = (
  feature: Feature,
  { files }: Coverage,
  links: PageLinks,
  type: 'default' | 'compact'
) => {
  /*
   * build headers
   * horizontal for specs
   * vertical for requirements
   */
  const horizontal = buildHorizontalHeaders(feature, files);
  const vertical = buildVerticalHeaders(feature);

  /*
   * build rows with intersections
   */
  const {
    rows: dataRows,
    coveredRequirements,
    totalRequirements,
    totalSpecCount,
  } = buildDataRows(vertical, horizontal);

  const renderer =
    type === "compact" ? featureCompactTemplate : featureTableTemplate;

  const categoriesSectionHtml = featureCategoriesTemplate({
    categoriesHtml: featureCategoryListTemplate({
      categories: vertical.categories,
      categoryLinkBase: "",
    }),
  });

  const tableHtml = renderer({
    // +1 for spec counts column
    requirementsDepth: feature.depth,
    featureTitle: feature.title,
    featureDescription: feature.description,
    featureHeaders: feature.headers || [],
    fileHeaders: horizontal.filesRow,
    specHeaders: horizontal.specsRow,
    dataRows,
    totalRequirements,
    coveredRequirements,
    totalSpecCount,
    dataHeaderRows: vertical.rows,
    links,
  });

  return `
${categoriesSectionHtml}
${tableHtml}
`;
};
