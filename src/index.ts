import { parseMultiple, Formula, Presets } from "./multiline"
export { ASTNode } from './ast'
export { epsilon } from './multiline'
import type { RangeResultType } from './util'
export {
  RangeResults,
  CompareMode,
  RangeResultType,
} from './util'

export type RangeFunction2D = (xmin: number, xmax: number, ymin: number, ymax: number) => RangeResultType
export type RangeFunction3D = (xmin: number, xmax: number, ymin: number, ymax: number, zmin: number, zmax: number) => RangeResultType
export type ValueFunction2D = (x: number, y: number) => number
export type ValueFunction3D = (x: number, y: number, z: number) => number
export {
  Formula,
  Presets,
  presets2D,
  presets3D,
  astToRangeFunctionCode,
  astToValueFunctionCode,
} from "./multiline"

export function parse(expression: string, argNames: string[], presets: Presets): Formula
export function parse(expressions: string[], argNames: string[], presets: Presets): Formula[]
export function parse(expressionOrExpressions: string | string[], argNames: string[], presets: Presets): Formula | Formula[] {
  if (Array.isArray(expressionOrExpressions)) {
    return parseMultiple(expressionOrExpressions, argNames, presets)
  } else {
    return parseMultiple([expressionOrExpressions], argNames, presets)[0]
  }
}
