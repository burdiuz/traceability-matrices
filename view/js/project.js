function handleCompactCategoryCollapse(tr) {
  const categoryLevel = parseInt(tr.dataset.level, 10);
  tr.classList.add("collapsed");

  let sibling = tr.nextSibling;

  while (sibling) {
    if (sibling.nodeType === Node.ELEMENT_NODE) {
      const level = parseInt(sibling.dataset.level, 10);

      if (level > categoryLevel) {
        if (sibling.classList.contains("category-row")) {
          sibling.classList.remove("collapsed");
        }

        sibling.classList.add("hidden");
      } else {
        break;
      }
    }

    sibling = sibling.nextSibling;
  }
}
function handleCompactCategoryExpand(tr) {
  const categoryLevel = parseInt(tr.dataset.level, 10);
  tr.classList.remove("collapsed");

  let sibling = tr.nextSibling;

  while (sibling) {
    if (sibling.nodeType === Node.ELEMENT_NODE) {
      const level = parseInt(sibling.dataset.level, 10);

      if (level > categoryLevel) {
        sibling.classList.remove("hidden");
      } else {
        break;
      }
    }

    sibling = sibling.nextSibling;
  }
}
