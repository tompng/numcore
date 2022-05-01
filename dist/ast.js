"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.astToRangeVarNameCode = exports.astToCode = exports.preEvaluateAST = exports.extractFunctions = exports.extractVariables = void 0;
function extractVariables(ast) {
    var set = new Set();
    function extract(ast) {
        var e_1, _a;
        if (typeof ast === 'number')
            return;
        if (typeof ast === 'string') {
            set.add(ast);
        }
        else {
            try {
                for (var _b = __values(ast.args), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var arg = _c.value;
                    extract(arg);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
    }
    extract(ast);
    return __spreadArray([], __read(set));
}
exports.extractVariables = extractVariables;
function extractFunctions(ast, functions) {
    var set = new Set();
    function extract(ast) {
        var e_2, _a;
        if (typeof ast === 'number' || typeof ast === 'string')
            return;
        if (functions.has(ast.op))
            set.add(ast.op);
        try {
            for (var _b = __values(ast.args), _c = _b.next(); !_c.done; _c = _b.next()) {
                var arg = _c.value;
                extract(arg);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
    }
    extract(ast);
    return __spreadArray([], __read(set));
}
exports.extractFunctions = extractFunctions;
function isNumberArray(arr) {
    return arr.every(function (arg) { return typeof arg === 'number'; });
}
function evalOperatorArgs(op, args) {
    if (args.length === 2) {
        var _a = __read(args, 2), a = _a[0], b = _a[1];
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
        var _b = __read(args, 1), a = _b[0];
        switch (op) {
            case '-@': return -a;
            case 'exp': return Math.exp(a);
            case 'log': return Math.log(a);
            case 'sqrt': return Math.sqrt(a);
            case 'sin': return Math.sin(a);
            case 'cos': return Math.cos(a);
            case 'tan': return Math.tan(a);
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
        }
    }
    else if (args.length !== 0) {
        switch (op) {
            case 'min': return Math.min.apply(Math, __spreadArray([], __read(args)));
            case 'max': return Math.max.apply(Math, __spreadArray([], __read(args)));
            case 'hypot': return Math.hypot.apply(Math, __spreadArray([], __read(args)));
        }
    }
}
function preEvaluateAST(ast, uniq, astResult) {
    if (astResult === void 0) { astResult = new Map(); }
    function traverse(ast) {
        if (typeof ast !== 'object')
            return ast;
        var result = astResult.get(ast);
        if (result != null)
            return result;
        var args = ast.args.map(traverse);
        if (isNumberArray(args)) {
            var v = evalOperatorArgs(ast.op, args);
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
function astToCode(ast, argNames) {
    if (typeof ast === 'number')
        return ast.toString();
    if (typeof ast === 'string') {
        if (argNames.has(ast))
            return ast;
        throw new Error("Unknown constant or variable: " + ast);
    }
    var args = ast.args.map(function (arg) { return astToCode(arg, argNames); });
    if (args.length === 2) {
        var _a = __read(args, 2), a = _a[0], b = _a[1];
        switch (ast.op) {
            case '^': return "(" + a + "**" + b + ")";
            case '+':
            case '-':
            case '*':
            case '/':
                return "(" + a + ast.op + b + ")";
            case 'atan':
                return "Math.atan2(" + a + "," + b + ")";
            default:
                return "Math." + ast.op + "(" + a + "," + b + ")";
        }
    }
    else if (args.length === 1) {
        var _b = __read(args, 1), a = _b[0];
        if (ast.op === '-@')
            return "(-" + a + ")";
        return "Math." + ast.op + "(" + a + ")";
    }
    else {
        return "Math." + ast.op + "(" + args.join(',') + ")";
    }
}
exports.astToCode = astToCode;
function astToRangeVarNameCode(ast, args, expanders, namer) {
    var e_3, _a;
    var variables = extractVariables(ast);
    var validVars = new Set(Object.keys(args));
    try {
        for (var variables_1 = __values(variables), variables_1_1 = variables_1.next(); !variables_1_1.done; variables_1_1 = variables_1.next()) {
            var varname = variables_1_1.value;
            if (!validVars.has(varname))
                throw "Unknown variable " + varname;
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (variables_1_1 && !variables_1_1.done && (_a = variables_1.return)) _a.call(variables_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
    return astToRangeVarNameCodeRec(ast, args, expanders, namer);
}
exports.astToRangeVarNameCode = astToRangeVarNameCode;
function astToRangeVarNameCodeRec(ast, argMap, expanders, namer) {
    if (typeof ast === 'number')
        return [ast, ''];
    if (typeof ast === 'string') {
        var varname = argMap[ast];
        if (!varname)
            throw new Error("Unknown constant or variable: " + ast);
        return [varname, ''];
    }
    var argCodes = ast.args.map(function (arg) { return astToRangeVarNameCodeRec(arg, argMap, expanders, namer); });
    var codes = argCodes.map(function (a) { return a[1]; });
    var args = argCodes.map(function (a) { return a[0]; });
    var expander = expanders[ast.op];
    if (!expander)
        throw new Error("Expander undefined for: " + ast.op);
    var _a = __read(expander(args, namer), 2), c = _a[0], ccode = _a[1];
    return [c, codes.join(';') + ';' + ccode];
}
