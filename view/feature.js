const { basename } = require("path");
const { compile } = require("pug");
const { isPopulated } = require("../reader/coverage-records");

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

/**
 *
 * @param {import("../reader/coverage-records").Feature} param0
 * @returns
 */
const buildHorizontalHeaders = ({ files }, globalFiles) => {
  const specs = [];
  const filesRow = [];
  const specsRow = [];

  const filePaths = Object.values(globalFiles).reduce(
    (res, { path, id }) => ({ ...res, [path]: id }),
    {}
  );

  // [path, records]
  Object.entries(files)
    .map(([path, records]) => [
      { path: filePaths[path], name: basename(path, ".json") },
      records,
    ])
    .sort(([{ name: a }], [{ name: b }]) => (a < b ? -1 : 1))
    .forEach(([{ path, name }, records]) => {
      const fileSpecsObj = Object.values(records).reduce(
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
      filesRow.push({
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
          specsRow.push({
            name: spec.title,
            title: spec.titlePath.join(" > "),
            colspan: 1,
          });
        });
    });

  // a list of specs in indices matching to their cell indices and rows list(first for file names and second for spec names).
  return { specs, filesRow, specsRow, rows: [filesRow, specsRow] };
};

/**
 * Go to the leaf nodes of a structure
 * 1. start building from leaf by adding new row
 * 2. leaf node will colspan maxDepth - currentDepth, add leaf requirements into some list to know which row corresponds to which requirement
 * 3. parent nodes will rowspan by count of children
 * 4. after building all nodes returns first row so we know where to add its parent, also inform parent about count of rows
 */
const buildVerticalHeaders = (feature) => {
  const { depth: maxDepth, structure } = feature;

  const buildChildren = (children, categories = [], depth, path = "") => {
    let requirementsTotal = 0;
    let requirementsCovered = 0;
    const childReqs = [];
    const childRows = [];

    Object.entries(children)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .forEach(([title, children]) => {
        const child = build(
          { title, children, specs: feature.records[title] || [] },
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

  const build = (requirement, categories, depth, path = "") => {
    const cell = {
      name: requirement.title,
      depth,
      category: false,
      requirementsTotal: 0,
      requirementsCovered: 0,

      // if title contains HTML -- strip tags
      title: requirement.title.replace(/<\/?[^>]+?>/gi, ""),
      colspan: 1,
      rowspan: 1,
    };

    if (isPopulated(requirement.children)) {
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
    }

    cell.colspan = maxDepth - depth;
    cell.requirementsTotal = feature.records[requirement.title] ? 1 : 0;
    cell.requirementsCovered = feature.records[requirement.title]?.length
      ? 1
      : 0;

    return {
      requirements: [requirement],
      rows: [[cell]],
      requirementsTotal: cell.requirementsTotal,
      requirementsCovered: cell.requirementsCovered,
    };
  };

  return buildChildren(structure, [], 0);
};

const buildDataRows = (vertical, horizontal) => {
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

const renderFeatureCategories = (feature, state, links) => {
  const categoriesHtml = renderFeatureCategoryList(feature, state, links);

  console.log(categoriesHtml);

  return featureCategoriesTemplate({
    categoriesHtml,
  });
};

const renderFeatureCategoryList = (feature, state, { getFeatureLink }) => {
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
const renderFeature = (feature, state, links, type) => {
  /*
   * build headers
   * horizontal for specs
   * vertical for requirements
   */
  const horizontal = buildHorizontalHeaders(feature, state.files);
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
module.exports.buildVerticalHeaders = buildVerticalHeaders;
module.exports.buildHorizontalHeaders = buildHorizontalHeaders;
module.exports.renderFeature = renderFeature;
module.exports.renderFeatureCategories = renderFeatureCategories;
module.exports.renderFeatureCategoryList = renderFeatureCategoryList;
