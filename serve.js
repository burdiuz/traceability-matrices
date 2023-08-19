const Koa = require("koa");
const { readFile } = require("fs/promises");
const Router = require("@koa/router");
const { compile } = require("pug");
const { readCoverage } = require("./reader/reader");
const { isPopulated } = require("./reader/coverage-records");

const fileStructureTemplate = compile(
  `
div.flex-vertical
  each result in self.roots
    div.dir-root #{result.root.name}
    each dir in result.list
      if dir.files.length
        div.directory
          div.dir-path #{dir.localPath}
          each file in dir.files
            div.file
              a(href=\`/file?id=\${file.id}\`) #{file.specName}
`,
  { self: true }
);

const projectsStructureTemplate = compile(
  `
div.flex-vertical
  each project in self.list
    div(class= project.covered ? 'project-link covered' : 'project-link')
      span.totals #{project.requirementsCovered} / #{project.requirementsTotal}
      a.title(href=\`/project?id=\${encodeURIComponent(project.title)}\`) #{project.title}
`,
  { self: true }
);

/**
 *
 * @param {import("./reader/reader").ReadCoverageResult} state
 */
const renderFiles = (state) => {
  return fileStructureTemplate(state);
};

/**
 * @param {import("./reader/reader").FileWithProjects} file
 * @param {import("./reader/reader").ReadCoverageResult} state
 */
const renderFile = (file, state) => {
  const list = Object.values(file.projects).map((source) => {
    const project = {
      ...source,
      requirements: { ...source.requirements },
      specs: { ...source.specs },
      files: { ...source.files },
    };

    Object.entries(project.files).forEach(([key, value]) => {
      if (value.path !== file.path) {
        delete project.files[key];
      }
    });

    Object.entries(project.specs).forEach(([key, value]) => {
      if (value.filePath !== file.path) {
        delete project.specs[key];
      }
    });

    Object.entries(project.requirements).forEach(([key, value]) => {
      project.requirements[key] = {
        ...value,
        specs: value.specs.filter((spec) => spec.filePath === file.path),
      };
    });

    //console.log(project.files);

    return renderProject(project, state);
  });

  return list.join("");
};

/**
 *
 * @param {import("./reader/reader").ReadCoverageResult} state
 */
const renderProjects = (state) => {
  const list = Object.values(state.projects).map((project) => {
    const stats = calculateProjectStats(project);

    return {
      title: project.title,
      ...stats,
    };
  });

  return projectsStructureTemplate({ list });
};

const projectTableTemplate = compile(`
table.project
  //- Header Rows
  tr.file-headers
    th.project-title(colspan=requirementsDepth, rowspan='2') #{projectTitle}
    th.spec-count(rowspan='2') Spec count
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

/**
 * 
 * @param {import("./reader/coverage-records").Project} param0 
 * @returns 
 */
const buildHorizontalHeaders = ({ files }) => {
  const specs = [];
  const filesRow = [];
  const specsRow = [];

  // [path, specs]
  Object.entries(files)
    .sort(([path1], [path2]) => (path1 < path2 ? -1 : 1))
    .forEach(([filePath, fileSpecsObj]) => {
      const specList = Object.values(fileSpecsObj);

      if (!specList.length) {
        return;
      }

      // add cell for file names row
      filesRow.push({
        name: filePath.match(/[^\/\\]+$/)[0],
        // TODO remove cypress coverage path part
        title: filePath,
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

    Object.values(children)
      .sort(({ title: a }, { title: b }) => (a < b ? -1 : 1))
      .forEach((requirement) => {
        const child = build(requirement, depth);
        childReqs.push(...child.requirements);
        childRows.push(...child.rows);
      });

    return { requirements: childReqs, rows: childRows };
  };

  const build = (requirement, depth) => {
    const cell = {
      name: requirement.title,
      title: requirement.title,
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
 * @param {import("./reader/coverage-records").Project} project
 * @param {import("./reader/reader").ReadCoverageResult} state
 */
const renderProject = (project, state) => {
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

  return tableHtml;
};

const calculateProjectStats = ({ requirements, specs, structure }) => {
  const requirementsCovered = Object.values(requirements).reduce(
    (reqs, requirement) => (requirement.specs.length ? reqs + 1 : reqs),
    0
  );

  const specsCount = Object.values(specs).length;

  /**
   * structure is a tree and leaf nodes are final requirements that matter,
   * not goups or other structural elements.
   * so we traverse it in width starting from root to count all leaf nodes
   */
  let requirementsTotal = 0;
  const queue = [{ children: structure }];
  while (queue.length) {
    const item = queue.shift();

    const children = Object.values(item.children);

    if (children.length) {
      queue.push(...children);
    } else {
      requirementsTotal++;
    }
  }

  return {
    covered: requirementsCovered >= requirementsTotal,
    requirementsCovered,
    requirementsTotal,
    specsCount,
  };
};

/**
 *
 * @param {import("./reader/reader").ReadCoverageResult} state
 */
const calculateTotals = (state) => {
  const projects = Object.values(state.projects);
  const {
    requirementsCovered: covered,
    requirementsTotal: requirements,
    specsCount: specs,
  } = projects.reduce(
    (counts, project) => {
      const { requirementsCovered, requirementsTotal, specsCount } =
        calculateProjectStats(project);

      return {
        requirementsCovered: requirementsCovered + counts.requirementsCovered,
        requirementsTotal: requirementsTotal + counts.requirementsTotal,
        specsCount: specsCount + counts.specsCount,
      };
    },
    { requirementsCovered: 0, requirementsTotal: 0, specsCount: 0 }
  );

  const requirementsTotal = projects.reduce((count, { structure }) => {
    const queue = [{ children: structure }];

    /**
     * structure is a tree and leaf nodes are final requirements that matter,
     * not goups or other structural elements.
     * so we traverse it in width starting from root to count all leaf nodes
     */
    while (queue.length) {
      const item = queue.shift();

      const children = Object.values(item.children);

      if (children.length) {
        queue.push(...children);
      } else {
        count++;
      }
    }

    return count;
  }, 0);

  const fileCount = state.roots.reduce(
    (total, result) =>
      total + result.list.reduce((count, { files }) => count + files.length, 0),
    0
  );

  return {
    projects: projects.length,
    files: fileCount,
    specs,
    requirements,
    covered,
    coverage: ((covered / requirements) * 100).toFixed(0),
  };
};

const serve = async (targetDirs, port) => {
  let state = await readCoverage(targetDirs);

  const app = new Koa();
  const router = new Router();

  const pageTemplateText = await readFile("./page.html", { encoding: "utf-8" });

  const pageTemplate = (content) => {
    const totals = calculateTotals(state);
    // console.log(totals);

    let template = Object.entries(totals).reduce(
      (tpl, [key, value]) => tpl.replace(`#{${key}}`, value),
      pageTemplateText
    );

    return template.replace("#{content}", content);
  };

  router.get("/", (ctx, next) => {
    ctx.redirect("/files");
  });

  router.get("/files", (ctx, next) => {
    const content = renderFiles(state);

    ctx.response.body = pageTemplate(content);
  });

  // /file?id=<file_path>
  router.get("/file", (ctx, next) => {
    const [, searchParamsStr] = ctx.request.url.match(/^[^?]+\?(.+)$/) || [];
    const searchParams = new URLSearchParams(searchParamsStr);
    const filePath = searchParams.get("id");
    const { [filePath]: file } = state.files;

    if (!file) {
      ctx.response.body = "File not found.";
      return;
    }

    const content = renderFile(file, state);

    ctx.response.body = pageTemplate(content);
  });

  router.get("/projects", (ctx, next) => {
    const content = renderProjects(state);

    ctx.response.body = pageTemplate(content);
  });

  // /file?id=<project_name>
  router.get("/project", (ctx, next) => {
    const [, searchParamsStr] = ctx.request.url.match(/^[^?]+\?(.+)$/) || [];
    const searchParams = new URLSearchParams(searchParamsStr);
    const projectId = searchParams.get("id");
    const { [projectId]: project } = state.projects;

    if (!project) {
      ctx.response.body = "Project not found.";
      return;
    }

    const content = renderProject(project, state);
    ctx.response.body = pageTemplate(content);
  });

  router.get("/refresh", async (ctx, next) => {
    state = await readCoverage(targetDirs);

    ctx.response.body = `<p>Refresh completed, going back...</p> <script>window.history.back();</script>`;
  });

  app.use(router.routes()).use(router.allowedMethods());

  app.listen(port);
};

module.exports.serve = serve;
