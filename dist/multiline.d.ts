import { UniqASTNode } from './ast';
import { CompareMode } from './util';
declare type PresetFunc = [args: string[], body: string];
export declare type Presets = Record<string, string | number | PresetFunc>;
declare type VarDef = {
    type: 'var';
    name: string;
    deps: string[];
    ast: UniqASTNode | null;
    error?: string;
};
declare type FuncDef = {
    type: 'func';
    name: string;
    deps: string[];
    args: string[];
    ast: UniqASTNode | null;
    error?: string;
};
declare type Equation = {
    type: 'eq';
    mode: CompareMode;
    deps: string[];
    ast: UniqASTNode | null;
    error?: string;
};
declare type Definition = VarDef | FuncDef;
export declare type Formula = Definition | Equation;
export declare const epsilon = 1e-15;
export declare function parseMultiple(formulaTexts: string[], argNames: string[], presets?: Presets): Formula[];
export declare function astToValueFunctionCode(uniqAST: UniqASTNode, args: string[]): string;
export declare function astToRangeFunctionCode(uniqAST: UniqASTNode, args: string[], option: {
    pos?: boolean;
    neg?: boolean;
    zero?: boolean;
    eq?: boolean;
}): string;
export declare const presets2D: Presets;
export declare const presets3D: Presets;
export {};
