export const getUniqueRequirementId = (() => {
  let id = 1;
  return () => `requirement-${String(id++).padStart(8, "0")}`;
})();

export const removeExtraSpaces = (value: string) => value.replace(/\s+/g, " ").trim();