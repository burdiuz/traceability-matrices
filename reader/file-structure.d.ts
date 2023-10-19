import { DirectoryInfo } from "./types";
export type ReadResult = {
    root: DirectoryInfo;
    list: DirectoryInfo[];
};
export declare const read: (root: string) => Promise<ReadResult>;
export declare const readAll: (paths: string[]) => Promise<ReadResult[]>;
