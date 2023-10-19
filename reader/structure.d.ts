/**
 * Lookup for leaf nodes and assign unique ids to them.
 * Treats leaf nodes as requirments and assigns unique id instead of their original value.
 * @param structure
 */
export declare const seedStructure: (structure: object) => void;
export declare const mergeFeatureStructure: (featureTitle: string, source: object, target: object) => void;
/**
 * Returns a map of requirement paths assigned to their ids
 * {
 *  id: path[]
 * }
 * @param structure
 * @param requirements
 * @returns
 */
export declare const getStructureRequirements: (structure: object, requirements?: Record<string, string[]>, path?: string[]) => Record<string, string[]>;
/**
 * Find requirement id by its name or path,
 * if not exists will create structure branch and return id
 * @param keys
 * @param structure
 * @returns
 */
export declare const findPathId: (keys: string[], structure: object) => string;
