import { MinMaxVarName, NameGenerator } from './util';
export declare type Expander = (args: (MinMaxVarName | number)[], namer: NameGenerator) => [MinMaxVarName | number, string];
export declare const GAPMARK = "/*GAP*/";
export declare const NANMARK = "/*NAN*/";
export declare function assertArgNum(name: string, args: any[], n: number): void;
export declare const expanders: {
    '+': Expander;
    '-': Expander;
    '-@': Expander;
    '*': Expander;
    '/': Expander;
    '^': Expander;
    sqrt: Expander;
    exp: Expander;
    log: Expander;
    sin: Expander;
    cos: Expander;
    sinh: Expander;
    cosh: Expander;
    tanh: Expander;
    asin: Expander;
    acos: Expander;
    atan: Expander;
    asinh: Expander;
    acosh: Expander;
    atanh: Expander;
    hypot: Expander;
    atan2: Expander;
    pow: Expander;
    abs: Expander;
    min: Expander;
    max: Expander;
    floor: Expander;
    ceil: Expander;
    round: Expander;
    sign: Expander;
    fact: Expander;
};
