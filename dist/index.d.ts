import { Formula, Presets } from "./multiline";
export { UniqASTNode, extractVariables } from './ast';
export { epsilon } from './multiline';
export { texToPlain } from './latex';
import type { RangeResultType } from './util';
export { RangeResults, CompareMode, RangeResultType, } from './util';
export declare type RangeFunction2D = (xmin: number, xmax: number, ymin: number, ymax: number) => RangeResultType;
export declare type RangeFunction3D = (xmin: number, xmax: number, ymin: number, ymax: number, zmin: number, zmax: number) => RangeResultType;
export declare type ValueFunction2D = (x: number, y: number) => number;
export declare type ValueFunction3D = (x: number, y: number, z: number) => number;
export { Formula, Presets, presets2D, presets3D, astToRangeFunctionCode, astToValueFunctionCode, } from "./multiline";
export declare function parse(expression: string, argNames: string[], presets: Presets): Formula;
export declare function parse(expressions: string[], argNames: string[], presets: Presets): Formula[];
