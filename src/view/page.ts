import { compile } from "pug";

export const listPageTemplate = compile(
  `
doctype
html
  head
    meta(charset='UTF-8')
    title #{self.pageTitle}
    style
      include /css/page.css
      include /css/files.css
      include /css/features.css
    script
      include /js/features.js
  body
    div.nav-bar
      a(href=self.links.getFilesLink()) Files
      a(href=self.links.getFeaturesLink() style="margin-right: auto") Features
      span
        | Features 
        strong #{self.totals.features} 
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

export const featurePageTemplate = compile(
  `
doctype
html
  head
    meta(charset='UTF-8')
    title #{self.pageTitle}
    style
      include /css/page.css
      include /css/feature.css
    script
      include /js/feature.js
  body
    div.nav-bar
      a(href=self.links.getFilesLink()) Files
      a(href=self.links.getFeaturesLink() style="margin-right: auto") Features
      span
        | Features 
        strong #{self.totals.features} 
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
