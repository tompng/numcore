import { MinMaxVarName, NameGenerator } from './util';
export declare const factorialCode: string;
export declare const factorial: any;
export declare const partials: {
    factorial: string;
    factorialRangeThreshold: string;
};
export declare function expandFactorial(x: number | MinMaxVarName, namer: NameGenerator, GAPMARK: string): [number | MinMaxVarName, string];
