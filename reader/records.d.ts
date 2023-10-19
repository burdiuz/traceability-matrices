import { FeatureRecord } from "./types";
/**
 * Converts list of requirements
 * [
 *   {
 *     requirement,
 *     spec
 *   },
 *   {
 *     requirement,
 *     spec
 *   },
 * ]
 * to a hash map
 * {
 *   requirement-id: [
 *     spec,
 *   ],
 *   requirement-id: [
 *     spec,
 *   ],
 * }
 */
export declare const convertRecordsListToMap: (list: FeatureRecord[], structure: object) => Record<string, FeatureRecord[]>;
/**
 * Removes duplicate specs for each requirement, in case if same
 * requirement was traced multiple times in one spec
 *
 * We just need to know if requirement was traced at least one, so
 * multiple records of same specs are not needed.
 * @param records
 */
export declare const setSpecsUnique: (records: Record<string, FeatureRecord[]>) => void;
/**
 * Used to merge file-level feature records to global feature
 * @param param0
 * @param param1
 */
export declare const mergeFeatureRecords: ({ records: source }: {
    records: Record<string, FeatureRecord[]>;
}, { records: target }: {
    records: Record<string, FeatureRecord[]>;
}) => void;
