export type PageLinks = {
  getFilesLink: () => string;
  getFeaturesLink: () => string;
  getFileLink: (id: string) => string;
  getFeatureLink: (id: string) => string;
  getRefreshLink?: () => string;
};
