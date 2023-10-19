import { type ReadResult } from "./file-structure";
import { FileInfo, type GlobalFeature } from "./types";
export declare const readCoverage: (paths: string[], features?: Record<string, GlobalFeature>) => Promise<{
    roots: ReadResult[];
    features: Record<string, GlobalFeature>;
    files: Record<string, FileInfo>;
}>;
