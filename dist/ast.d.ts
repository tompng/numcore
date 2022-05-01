import { NameGenerator, UniqASTGenerator, MinMaxVarName } from './util';
import { Expander } from "./expander";
export declare type ASTOpNode = {
    op: string;
    args: ASTNode[];
};
export declare type ASTNode = string | number | ASTOpNode;
export declare type UniqASTOpNode = {
    op: string;
    args: UniqASTNode[];
    uniqId: number;
    uniqKey: string;
};
export declare type UniqASTNode = string | number | UniqASTOpNode;
export declare function extractVariables(ast: ASTNode): string[];
export declare function extractFunctions(ast: ASTNode, functions: Set<string>): string[];
export declare function preEvaluateAST(ast: UniqASTNode, uniq: UniqASTGenerator, astResult?: Map<UniqASTNode, UniqASTNode>): UniqASTNode;
export declare function astToCode(ast: ASTNode, argNames: Set<string>): string;
export declare function astToRangeVarNameCode(ast: ASTNode, args: Record<string, MinMaxVarName>, expanders: Record<string, Expander>, namer: NameGenerator): [MinMaxVarName | number, string];
