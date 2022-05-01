export declare type MinMaxVarName = [min: string, max: string];
export declare type RangeResultType = (typeof RangeResults)[keyof typeof RangeResults];
export declare const RangeResults: {
    readonly HASGAP: -3;
    readonly HASNAN: -2;
    readonly BOTH: -1;
    readonly EQZERO: 0;
    readonly NEGATIVE: 1;
    readonly POSITIVE: 2;
    readonly EQNAN: 3;
    readonly OTHER: 4;
};
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
export declare type NameGenerator = () => string;
export declare type CompareMode = '=' | '>' | '>=' | '<' | '<=' | null;
export declare function createNameGenerator(): NameGenerator;
export declare class UniqASTGenerator {
    key2ast: Map<string, UniqASTNode>;
    idCnt: number;
    create(op: string, args: UniqASTNode[]): UniqASTNode;
    convert(ast: ASTNode): UniqASTNode;
    calcKey(op: string, args: UniqASTNode[]): string;
}
