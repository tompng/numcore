import type { ASTNode } from './ast';
import type { CompareMode } from './util';
export declare const predefinedFunctionNames: Set<string>;
export declare function parse(s: string, extraVariables?: Set<string>, extraFunctions?: Set<string>): [ASTNode, CompareMode];
