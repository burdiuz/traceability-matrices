function handleProjectFilesToggleVisibility(row) {
  const files = row.querySelector(".project-files-list");
  const categories = row.querySelector(".category-listing-root");

  if (files) {
    if (files.classList.contains("visible")) {
      files.classList.remove("visible");
    } else {
      files.classList.add("visible");
    }
  }

  if(categories) {
    categories.classList.remove("visible");
  }
}
function handleProjectCategoriesToggleVisibility(row) {
  const files = row.querySelector(".project-files-list");
  const categories = row.querySelector(".category-listing-root");

  if (categories) {
    if (categories.classList.contains("visible")) {
      categories.classList.remove("visible");
    } else {
      categories.classList.add("visible");
    }
  }

  if(files) {
    files.classList.remove("visible");
  }
}
