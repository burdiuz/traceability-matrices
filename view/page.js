const { compile } = require("pug");

const pageTemplate = compile(
  `
doctype
html
  head
    meta(charset='UTF-8')
    title #{self.pageTitle}
    style
      include /css/page.css
      include /css/files.css
      include /css/projects.css
      include /css/project.css
    body
      div.nav-bar
        a(href=self.links.getFilesLink()) Files
        a(href=self.links.getProjectsLink() style="margin-right: auto") Projects
        span
          | Projects 
          strong #{self.totals.projects} 
          | Files 
          strong #{self.totals.files} 
          | Specs 
          strong #{self.totals.specs} 
          | Requirements 
          strong #{self.totals.requirements} 
          | Coverage 
          strong #{self.totals.coverage}% 
        if self.links.getRefreshLink
          a(href=self.links.getRefreshLink() style="margin-left: auto") Refresh
        else 
          span(style="margin-left: auto")
  | !{self.content}
`,
  { self: true, filename: "pug", basedir: __dirname }
);

module.exports.pageTemplate = pageTemplate;
