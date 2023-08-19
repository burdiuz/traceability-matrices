const { compile } = require("pug");

const projectTableTemplate = compile(`
table.project
  //- Header Rows
  tr.file-headers
    th.project-title(colspan=requirementsDepth+1, rowspan='2') #{projectTitle}
    each file in fileHeaders
      th.file-name(colspan=file.colspan, title=file.title) #{file.name}
  tr.specs-headers
    each spec in specHeaders
      th.spec-name(title=spec.title) #{spec.name}

  //- Data Rows
  each row, index in dataRows
    tr(class=\`result \${row.class}\`)
      each header in dataHeaderRows[index]
        th(colspan=header.colspan, rowspan=header.rowspan, class=header.class, title=header.title) #{header.name}
      each data in row.cells
        td(title=data.title, class=data.class) #{data.name}
  //- Totals
  tr.totals
    td(colspan=requirementsDepth) Project Coverage
    td(colspan=totalSpecCount+1) #{coveredRequirements} / #{totalRequirements}
`);


(async () => {
  const projects = await parse(
    'cypress_coverage/src/components/pages/_e2e_/_____/test_trace_a.spec.js.json'
  );

  const project = projects['Project A'];

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
    fileHeaders: horizontal.filesRow,
    specHeaders: horizontal.specsRow,
    dataRows,
    totalRequirements,
    coveredRequirements,
    totalSpecCount,
    dataHeaderRows: vertical.rows,
  });

  console.log(tableHtml);
})();
