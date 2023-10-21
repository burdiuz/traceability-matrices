export type PageLinks = {
  getFilesLink: () => string;
  getFeaturesLink: () => string;
  getFileLink: (id: string) => string;
  getFeatureLink: (title: string) => string;
  getRefreshLink: () => string;
};
