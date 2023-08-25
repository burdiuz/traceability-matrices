const { basename } = require("path");
const { compile } = require("pug");
const { isPopulated } = require("../reader/coverage-records");

const projectTableTemplate = compile(
  `
table.project

  if self.projectDescription
    tr
      td.project-description(colspan=self.requirementsDepth + self.totalSpecCount + 1) !{self.projectDescription}

  //- Header Rows
  tr.file-headers
    th.project-title(colspan=self.requirementsDepth, rowspan=self.projectHeaders.length ? 1 : 2) #{self.projectTitle} (#{self.coveredRequirements} / #{self.totalRequirements})
    th.spec-count(rowspan='2') Spec count
    each file in self.fileHeaders
      th.file-name(colspan=file.colspan, title=file.title) #{file.name}
  tr.specs-headers
    if self.projectHeaders.length
      - var index = 0;
      while index < self.requirementsDepth
        th.header(title=self.projectHeaders[index]) #{self.projectHeaders[index]}
        - index++;
    each spec in self.specHeaders
      th.spec-name(title=spec.title) #{spec.name}

  //- Data Rows
  each row, index in self.dataRows
    tr(class=\`result \${row.class}\`)
      each header in self.dataHeaderRows[index]
        th(colspan=header.colspan, rowspan=header.rowspan, class=header.class, title=header.title) !{header.name}
      each data in row.cells
        td(title=data.title, class=data.class) #{data.name}

  //- Totals
  tr.totals
    td(colspan=self.requirementsDepth) Project Coverage
    td(colspan=self.totalSpecCount + 1) #{self.coveredRequirements} / #{self.totalRequirements}
`,
  { self: true }
);

/**
 *
 * @param {import("../reader/coverage-records").Project} param0
 * @returns
 */
const buildHorizontalHeaders = ({ files }) => {
  const specs = [];
  const filesRow = [];
  const specsRow = [];

  // [path, records]
  Object.entries(files)
    .map(([path, records]) => [basename(path, ".json"), records])
    .sort(([path1], [path2]) => (path1 < path2 ? -1 : 1))
    .forEach(([fileName, records]) => {
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
        name: fileName,
        // TODO remove cypress coverage path part
        title: fileName,
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
const buildVerticalHeaders = (project) => {
  const { depth: maxDepth, structure } = project;

  const buildChildren = (children, depth) => {
    const childReqs = [];
    const childRows = [];

    Object.entries(children)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .forEach(([title, children]) => {
        const child = build(
          { title, children, specs: project.records[title] || [] },
          depth
        );
        childReqs.push(...child.requirements);
        childRows.push(...child.rows);
      });

    return { requirements: childReqs, rows: childRows };
  };

  const build = (requirement, depth) => {
    const cell = {
      name: requirement.title,

      // if title contains HTML -- strip tags
      title: requirement.title.replace(/<\/?[^>]+?>/gi, ""),
      colspan: 1,
      rowspan: 1,
    };

    if (isPopulated(requirement.children)) {
      const children = buildChildren(requirement.children, depth + 1);
      cell.rowspan = children.rows.length;
      children.rows[0].unshift(cell);
      return children;
    }

    cell.colspan = maxDepth - depth;

    return { requirements: [requirement], rows: [[cell]] };
  };

  return buildChildren(structure, 0);
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

/**
 *
 * @param {import("../reader/coverage-records").Project} project
 * @param {import("../reader/reader").ReadCoverageResult} state
 */
const renderProject = (project, state, links) => {
  /*
   * build headers
   * horizontal for specs
   * vertical for requirements
   */
  const horizontal = buildHorizontalHeaders(project);
  const vertical = buildVerticalHeaders(project);

  /*
   * build rows with intersections
   */
  const {
    rows: dataRows,
    coveredRequirements,
    totalRequirements,
    totalSpecCount,
  } = buildDataRows(vertical, horizontal);

  const tableHtml = projectTableTemplate({
    // +1 for spec counts column
    requirementsDepth: project.depth,
    projectTitle: project.title,
    projectDescription: project.description,
    projectHeaders: project.headers || [],
    fileHeaders: horizontal.filesRow,
    specHeaders: horizontal.specsRow,
    dataRows,
    totalRequirements,
    coveredRequirements,
    totalSpecCount,
    dataHeaderRows: vertical.rows,
    links,
  });

  return tableHtml;
};

module.exports.renderProject = renderProject;
