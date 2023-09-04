import { ReadCoverageResult } from "../reader/reader";

export type Cell = {
  name: string;
  depth: number;
  category: boolean;
  requirementsTotal: number;
  requirementsCovered: number;
  title: string;
  colspan: number;
  rowspan: number;
};

export type RequirementCell = Cell & {
  category: false;
};

export type CategoryCell = Cell & {
  id: string;
  class: string;
  category: true;
  categories: CategoryCell[];
};

export declare const buildVerticalHeaders: (state: ReadCoverageResult) => {
  requirements: RequirementCell[];
  rows: (RequirementCell | CategoryCell)[][];
  categories: CategoryCell[];
  requirementsCovered: number;
  requirementsTotal: number;
};
