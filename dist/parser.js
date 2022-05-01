"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.predefinedFunctionNames = void 0;
exports.predefinedFunctionNames = new Set([
    'log', 'exp', 'sqrt', 'pow', 'hypot', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh', 'atan2', '√', 'abs', 'min', 'max',
    'arcsin', 'arccos', 'arctan', 'arctanh', 'arccosh', 'arcsinh',
    'floor', 'ceil', 'round', 'sgn', 'sign', 'signum'
]);
var comparers = new Set(['<', '=', '>', '<=', '>=']);
var operators = new Set(['+', '-', '*', '/', '^', '**']);
var alias = {
    '**': '^', '√': 'sqrt',
    'arcsin': 'asin', 'arccos': 'acos', 'arctan': 'atan',
    'arctanh': 'atanh', 'arccosh': 'acosh', 'arcsinh': 'asinh',
    'π': 'pi', 'PI': 'pi', 'E': 'e',
    'th': 'theta', 'θ': 'theta', 'φ': 'phi',
    'sgn': 'sign', 'signum': 'sign'
};
var tokenSet = new Set(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], __read(exports.predefinedFunctionNames)), __read(Object.keys(alias))), __read(operators)), __read(comparers)), [',', ' ']));
function parseParen(input) {
    var e_1, _a;
    var stack = [[]];
    var current = stack[stack.length - 1];
    try {
        for (var input_1 = __values(input), input_1_1 = input_1.next(); !input_1_1.done; input_1_1 = input_1.next()) {
            var c = input_1_1.value;
            if (c === '(') {
                var child = [];
                current.push(child);
                stack.push(current = child);
            }
            else if (c === ')') {
                stack.pop();
                if (stack.length === 0)
                    throw 'Paren Mismatch';
                current = stack[stack.length - 1];
            }
            else {
                current.push(c);
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (input_1_1 && !input_1_1.done && (_a = input_1.return)) _a.call(input_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    if (stack.length !== 1)
        throw 'Paren Mismatch';
    return current;
}
function convertAlias(s) {
    return alias[s] || s;
}
function matchToken(s, i, tokens) {
    if (s[i].match(/\d/)) {
        var len = 1;
        var dotCount = 0;
        while (i + len < s.length && (s[i + len].match(/\d/) || (dotCount === 0 && s[i + len] === '.'))) {
            if (s[i + len] === '.')
                dotCount++;
            len++;
        }
        return [parseFloat(s.substr(i, len)), len];
    }
    for (var len = tokens.max; len >= 1; len -= 1) {
        if (tokens.set.has(s.substr(i, len)))
            return [convertAlias(s.substr(i, len)), len];
    }
    return null;
}
function tokenize(group, tokens) {
    var out = [];
    var pattern = group.map(function (s) { return typeof s === 'string' ? s : '@'; }).join('');
    for (var i = 0; i < group.length;) {
        var item = group[i];
        if (item === ' ') {
            if (out[out.length - 1] !== item)
                out.push(item);
            i += 1;
        }
        else if (typeof item === 'string') {
            var result = matchToken(pattern, i, tokens);
            if (!result)
                throw "Unexpected Token \"" + pattern[i] + "\"";
            var _a = __read(result, 2), v = _a[0], len = _a[1];
            out.push(v);
            i += len;
        }
        else {
            out.push(tokenize(item, tokens));
            i++;
        }
    }
    return out;
}
function parse(s, extraVariables, extraFunctions) {
    var e_2, _a;
    var pg = parseParen(s);
    var tokens = { set: new Set(tokenSet), max: 0 };
    var functions = new Set(exports.predefinedFunctionNames);
    if (extraVariables)
        extraVariables.forEach(function (t) { return tokens.set.add(t); });
    if (extraFunctions)
        extraFunctions.forEach(function (t) {
            tokens.set.add(t);
            functions.add(t);
        });
    try {
        for (var _b = __values(tokens.set), _c = _b.next(); !_c.done; _c = _b.next()) {
            var t = _c.value;
            if (tokens.max < t.length)
                tokens.max = t.length;
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_2) throw e_2.error; }
    }
    var tg = tokenize(pg, tokens);
    return buildRootAST(tg, functions);
}
exports.parse = parse;
function flipComparator(cmp) {
    switch (cmp) {
        case '>': return '<';
        case '>=': return '<=';
        case '<': return '>';
        case '<=': return '>=';
        default: return cmp;
    }
}
function buildRootAST(group, functionNames) {
    var idx = group.findIndex(function (item) { return typeof item === 'string' && comparers.has(item); });
    if (idx === -1) {
        var ast = buildAST(group, functionNames);
        if (Array.isArray(ast))
            throw 'Unexpected comma';
        return [ast, null];
    }
    var cmp = group[idx];
    var left = buildAST(group.slice(0, idx), functionNames);
    var right = buildAST(group.slice(idx + 1), functionNames);
    if (Array.isArray(left) || Array.isArray(right))
        throw 'Unexpected comma';
    if (left === 0) {
        return [right, flipComparator(cmp)];
    }
    else if (right === 0) {
        return [left, cmp];
    }
    else {
        return [{ op: '-', args: [left, right] }, cmp];
    }
}
var oplist = [new Set(['+', '-']), new Set(['*', '/', ' '])];
function buildFuncMultPow(group, functionNames) {
    var values = group.map(function (g) {
        if (typeof g !== 'object')
            return g;
        var astOrArg = buildAST(g, functionNames);
        return Array.isArray(astOrArg) ? { type: 'args', value: astOrArg } : { type: 'paren', value: astOrArg };
    });
    var mults = [];
    var concatable = false;
    var pow;
    for (var index = values.length - 1; index >= 0; index--) {
        var v = values[index];
        if (typeof v === 'object') {
            var prev = index > 0 && values[index - 1];
            var isPrevFunc = typeof prev === 'string' && functionNames.has(prev);
            if (v.type === 'args') {
                if (!isPrevFunc)
                    throw 'Function Required';
                var fcall = { op: prev, args: v.value };
                if (pow != null) {
                    mults.unshift({ op: '^', args: [fcall, pow] });
                    pow = undefined;
                }
                else {
                    mults.unshift(fcall);
                }
                index--;
            }
            else {
                if (pow != null && !isPrevFunc) {
                    mults.unshift({ op: '^', args: [v.value, pow] });
                    pow = undefined;
                }
                else {
                    mults.unshift(v.value);
                }
            }
            concatable = false;
        }
        else if (v === '^') {
            if (mults[0] == null || pow != null)
                throw "Error after ^";
            pow = mults.shift();
            concatable = false;
        }
        else if (typeof v === 'string' && functionNames.has(v)) {
            if (mults[0] == null)
                throw "Function Arg Required: " + v;
            if (pow != null) {
                mults[0] = { op: '^', args: [{ op: v, args: [mults[0]] }, pow] };
                pow = undefined;
            }
            else {
                mults[0] = { op: v, args: [mults[0]] };
            }
            concatable = false;
        }
        else {
            if (pow != null) {
                mults.unshift({ op: '^', args: [v, pow] });
                pow = undefined;
            }
            else if (concatable) {
                mults[0] = { op: '*', args: [v, mults[0]] };
            }
            else {
                mults.unshift(v);
            }
            concatable = true;
        }
    }
    if (pow != null)
        throw 'Error at ^';
    if (mults.length === 0)
        throw "Unexpected Empty Block";
    return mults.reduce(function (a, b) { return ({ op: '*', args: [a, b] }); });
}
function splitByOp(group, index, functionNames) {
    var e_3, _a;
    if (index === oplist.length)
        return buildFuncMultPow(group, functionNames);
    var ops = oplist[index];
    var current = [];
    var groups = [current];
    var operators = [];
    try {
        for (var group_1 = __values(group), group_1_1 = group_1.next(); !group_1_1.done; group_1_1 = group_1.next()) {
            var item = group_1_1.value;
            if (typeof item === 'string' && ops.has(item)) {
                operators.push(item);
                groups.push(current = []);
            }
            else {
                current.push(item);
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (group_1_1 && !group_1_1.done && (_a = group_1.return)) _a.call(group_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
    var first = groups[0];
    var ast = first.length === 0 ? null : splitByOp(first, index + 1, functionNames);
    operators.forEach(function (op, i) {
        var left = ast;
        var rgroup = groups[i + 1];
        var right = rgroup.length === 0 ? null : splitByOp(rgroup, index + 1, functionNames);
        if (right == null) {
            if (op === ' ')
                return;
            throw "No Right Hand Side: " + op;
        }
        if (left == null) {
            if (op === '-')
                ast = { op: '-@', args: [right] };
            else if (op === ' ')
                ast = right;
            else
                throw "No Left Hand Side: " + op;
        }
        else {
            ast = { op: op === ' ' ? '*' : op, args: [left, right] };
        }
    });
    if (ast == null)
        throw 'Unexpected Empty Group';
    return ast;
}
function buildAST(group, functionNames) {
    var e_4, _a;
    var current = [];
    var out = [current];
    try {
        for (var group_2 = __values(group), group_2_1 = group_2.next(); !group_2_1.done; group_2_1 = group_2.next()) {
            var item = group_2_1.value;
            if (item == ',')
                out.push(current = []);
            else
                current.push(item);
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (group_2_1 && !group_2_1.done && (_a = group_2.return)) _a.call(group_2);
        }
        finally { if (e_4) throw e_4.error; }
    }
    var astNodes = out.map(function (g) { return splitByOp(g, 0, functionNames); });
    if (astNodes.length === 1)
        return astNodes[0];
    return astNodes;
}
