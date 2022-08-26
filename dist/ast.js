"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.astToRangeVarNameCode = exports.astToCode = exports.preEvaluateAST = exports.extractFunctions = exports.extractVariables = void 0;
const factorial_1 = require("./factorial");
function extractVariables(ast) {
    const set = new Set();
    function extract(ast) {
        if (typeof ast === 'number')
            return;
        if (typeof ast === 'string') {
            set.add(ast);
        }
        else {
            for (const arg of ast.args)
                extract(arg);
        }
    }
    extract(ast);
    return [...set];
}
exports.extractVariables = extractVariables;
function extractFunctions(ast, functions) {
    const set = new Set();
    function extract(ast) {
        if (typeof ast === 'number' || typeof ast === 'string')
            return;
        if (functions.has(ast.op))
            set.add(ast.op);
        for (const arg of ast.args)
            extract(arg);
    }
    extract(ast);
    return [...set];
}
exports.extractFunctions = extractFunctions;
function isNumberArray(arr) {
    return arr.every(arg => typeof arg === 'number');
}
function evalOperatorArgs(op, args) {
    if (args.length === 2) {
        const [a, b] = args;
        switch (op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return a / b;
            case '^': return Math.pow(a, b);
            case 'hypot': return Math.hypot(a, b);
            case 'atan':
            case 'atan2': return Math.atan2(a, b);
            case 'pow': return Math.pow(a, b);
        }
    }
    else if (args.length === 1) {
        const [a] = args;
        switch (op) {
            case '-@': return -a;
            case 'exp': return Math.exp(a);
            case 'log': return Math.log(a);
            case 'sqrt': return Math.sqrt(a);
            case 'sin': return Math.sin(a);
            case 'cos': return Math.cos(a);
            case 'sinh': return Math.sinh(a);
            case 'cosh': return Math.cosh(a);
            case 'tanh': return Math.tanh(a);
            case 'asin': return Math.asin(a);
            case 'acos': return Math.acos(a);
            case 'atan': return Math.atan(a);
            case 'asinh': return Math.asinh(a);
            case 'acosh': return Math.acosh(a);
            case 'atanh': return Math.atanh(a);
            case 'abs': return Math.abs(a);
            case 'floor': return Math.floor(a);
            case 'round': return Math.round(a);
            case 'ceil': return Math.ceil(a);
            case 'sign': return Math.sign(a);
            case 'fact': return factorial_1.factorial(a);
        }
    }
    else if (args.length !== 0) {
        switch (op) {
            case 'min': return Math.min(...args);
            case 'max': return Math.max(...args);
            case 'hypot': return Math.hypot(...args);
        }
    }
}
function preEvaluateAST(ast, uniq, astResult = new Map()) {
    function traverse(ast) {
        if (typeof ast !== 'object')
            return ast;
        let result = astResult.get(ast);
        if (result != null)
            return result;
        const args = ast.args.map(traverse);
        if (args.some(arg => typeof arg === 'number' && isNaN(arg)))
            return NaN;
        if (isNumberArray(args)) {
            const v = evalOperatorArgs(ast.op, args);
            if (v != null)
                result = v;
        }
        if (result == null)
            result = uniq.create(ast.op, args);
        astResult.set(ast, result);
        return result;
    }
    return traverse(ast);
}
exports.preEvaluateAST = preEvaluateAST;
const funcAlias2 = {
    atan: 'Math.atan2'
};
const funcAlias1 = {
    fact: '/*REQUIRE(factorial)*/factorial'
};
function astToCode(ast, argNames) {
    if (typeof ast === 'number')
        return ast < 0 ? `(${ast})` : ast.toString();
    if (typeof ast === 'string') {
        if (argNames.has(ast))
            return ast;
        throw new Error(`Unknown constant or variable: ${ast}`);
    }
    const args = ast.args.map(arg => astToCode(arg, argNames));
    if (args.length === 2) {
        const [a, b] = args;
        switch (ast.op) {
            case '^': return `(${a}**${b})`;
            case '+':
            case '-':
            case '*':
            case '/':
                return `(${a}${ast.op}${b})`;
        }
        const alias = funcAlias2[ast.op];
        if (alias)
            return `${alias}(${a},${b})`;
        return `Math.${ast.op}(${a},${b})`;
    }
    else if (args.length === 1) {
        const [a] = args;
        if (ast.op === '-@')
            return `(-${a})`;
        const alias = funcAlias1[ast.op];
        if (alias)
            return `${alias}(${a})`;
        return `Math.${ast.op}(${a})`;
    }
    else {
        return `Math.${ast.op}(${args.join(',')})`;
    }
}
exports.astToCode = astToCode;
function astToRangeVarNameCode(ast, args, expanders, namer) {
    const variables = extractVariables(ast);
    const validVars = new Set(Object.keys(args));
    for (const varname of variables) {
        if (!validVars.has(varname))
            throw `Unknown variable ${varname}`;
    }
    return astToRangeVarNameCodeRec(ast, args, expanders, namer);
}
exports.astToRangeVarNameCode = astToRangeVarNameCode;
function astToRangeVarNameCodeRec(ast, argMap, expanders, namer) {
    if (typeof ast === 'number')
        return [ast, ''];
    if (typeof ast === 'string') {
        const varname = argMap[ast];
        if (!varname)
            throw new Error(`Unknown constant or variable: ${ast}`);
        return [varname, ''];
    }
    const argCodes = ast.args.map(arg => astToRangeVarNameCodeRec(arg, argMap, expanders, namer));
    const codes = argCodes.map(a => a[1]);
    const args = argCodes.map(a => a[0]);
    const expander = expanders[ast.op];
    if (!expander)
        throw new Error(`Expander undefined for: ${ast.op}`);
    const [c, ccode] = expander(args, namer);
    return [c, codes.join(';') + ';' + ccode];
}
