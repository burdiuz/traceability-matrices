import { Feature, GlobalFeature } from "./types";
export declare const readFeatures: (filePath: string, globalFeatures: Record<string, GlobalFeature>) => Promise<Feature[]>;
