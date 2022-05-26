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
    'log', 'exp', 'sqrt', 'pow', 'hypot', 'sin', 'cos', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh', 'atan2', '√', 'abs', 'min', 'max',
    'arcsin', 'arccos', 'arctan', 'arctanh', 'arccosh', 'arcsinh',
    'floor', 'ceil', 'round', 'sgn', 'sign', 'signum', 'fact', 'factorial',
]);
var comparers = new Set(['<', '=', '>', '<=', '>=', '≤', '≥']);
var comparerAlias = { '≤': '<=', '≥': '>=' };
var operators = new Set(['+', '-', '*', '/', '^', '**', '!', '・', '×', '÷']);
var alias = {
    '・': '*', '×': '*', '÷': '/', '**': '^', '√': 'sqrt',
    'arcsin': 'asin', 'arccos': 'acos', 'arctan': 'atan',
    'arctanh': 'atanh', 'arccosh': 'acosh', 'arcsinh': 'asinh',
    'π': 'pi', 'th': 'theta', 'θ': 'theta', 'φ': 'phi',
    'sgn': 'sign', 'signum': 'sign', 'factorial': 'fact',
};
var tokenSet = new Set(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], __read(exports.predefinedFunctionNames)), __read(Object.keys(alias))), __read(operators)), __read(comparers)), [',', ' ']));
function parseParen(input) {
    var e_1, _a;
    var stack = [{ abs: false, group: [] }];
    var current = stack[stack.length - 1];
    var push = function (abs) {
        var group = [];
        current.group.push(group);
        stack.push(current = { abs: abs, group: group });
    };
    var pop = function (abs) {
        var last = stack.pop();
        if (last.abs !== abs)
            throw 'Absolute Paren Mismatch';
        if (stack.length === 0)
            throw 'Paren Mismatch';
        current = stack[stack.length - 1];
    };
    try {
        for (var input_1 = __values(input), input_1_1 = input_1.next(); !input_1_1.done; input_1_1 = input_1.next()) {
            var c = input_1_1.value;
            if (c === '(') {
                push(false);
            }
            else if (c === ')') {
                pop(false);
            }
            else if (c === '|') {
                if (stack[stack.length - 1].abs) {
                    pop(true);
                }
                else {
                    current.group.push('a', 'b', 's');
                    push(true);
                }
            }
            else {
                current.group.push(c);
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
    return current.group;
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
    var pg = parseParen(s.replace(/\s/g, ' '));
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
    var _a;
    var idx = group.findIndex(function (item) { return typeof item === 'string' && comparers.has(item); });
    if (idx === -1) {
        var ast = buildAST(group, functionNames);
        if (Array.isArray(ast))
            throw 'Unexpected comma';
        return [ast, null];
    }
    var cmp = group[idx];
    var compareMode = ((_a = comparerAlias[cmp]) !== null && _a !== void 0 ? _a : cmp);
    var left = buildAST(group.slice(0, idx), functionNames);
    var right = buildAST(group.slice(idx + 1), functionNames);
    if (Array.isArray(left) || Array.isArray(right))
        throw 'Unexpected comma';
    if (left === 0) {
        return [right, flipComparator(compareMode)];
    }
    else if (right === 0) {
        return [left, compareMode];
    }
    else {
        return [{ op: '-', args: [left, right] }, compareMode];
    }
}
var oplist = [new Set(['+', '-']), new Set(['*', '/'])];
function assertIndependentNode(node, functionNames) {
    if (typeof node === 'string') {
        if (node === '!' || node === '^')
            throw 'Unexpected operator. Wrap with paren.';
        if (functionNames && functionNames.has(node))
            throw 'Unexpected function. Wrap with paren.';
    }
    return node;
}
var inverseExistingFunctions = new Set(['sin', 'cos', 'tan', 'sinh', 'cosh', 'tanh']);
function isIndependentNode(node, functionNames) {
    if (typeof node === 'string') {
        if (node === ' ' || node === '!' || node === '^')
            return false;
        if (functionNames && functionNames.has(node))
            return false;
    }
    return true;
}
function unwrapNode(node, functionNames) {
    if (typeof node === 'object') {
        if (node.type === 'args')
            throw 'Unexpected function argument';
        return node.value;
    }
    return assertIndependentNode(node, functionNames);
}
function buildFuncMultPowBang(group, functionNames) {
    var e_3, _a;
    var values = group.map(function (g) {
        if (typeof g !== 'object')
            return g;
        var astOrArg = buildAST(g, functionNames);
        return Array.isArray(astOrArg) ? { type: 'args', value: astOrArg } : { type: 'paren', value: astOrArg };
    });
    function mult(nodes) { return nodes.reduce(function (a, b) { return ({ op: '*', args: [a, b] }); }); }
    function splitLast(item) {
        return [item.slice(0, item.length - 1), item[item.length - 1]];
    }
    function isFunction(node) {
        return typeof node === 'string' && functionNames.has(node);
    }
    var multGroups = [];
    var consumer = {
        'default': function (node) {
            if (node == null)
                return ['default'];
            if (node === ' ')
                return ['default'];
            if (typeof node === 'string' && isFunction(node)) {
                return ['func', node];
            }
            if (typeof node === 'object') {
                return ['group', unwrapNode(node, functionNames)];
            }
            return ['numvars', [unwrapNode(node, functionNames)]];
        },
        'numvars': function (node, value) {
            if (node == null || isFunction(node) || typeof node === 'object') {
                multGroups.push(mult(value));
                return this.default(node);
            }
            if (node === ' ')
                return ['numvars ', value];
            if (node === '^')
                return ['numvars ^', value];
            if (node === '!') {
                var _a = __read(splitLast(value), 2), other = _a[0], last = _a[1];
                multGroups.push(mult(__spreadArray(__spreadArray([], __read(other)), [{ op: 'fact', args: [last] }])));
                return ['default'];
            }
            return ['numvars', __spreadArray(__spreadArray([], __read(value)), [unwrapNode(node, functionNames)])];
        },
        'numvars ': function (node, value) {
            if (node === ' ' || node === '^' || node === '!')
                return this['numvars'](node, value);
            this['numvars'](null, value);
            return this.default(node);
        },
        'group': function (node, value) {
            if (node == null) {
                multGroups.push(value);
                return ['default'];
            }
            if (node === ' ')
                return ['group', value];
            if (node === '^')
                return ['group ^', value];
            if (node === '!') {
                multGroups.push({ op: 'fact', args: [value] });
                return ['default'];
            }
            multGroups.push(value);
            return this.default(node);
        },
        'numvars ^': function (node, value) {
            if (node == null)
                throw 'Unexpected end of input after ^';
            if (node === ' ')
                return ['numvars ^', value];
            var _a = __read(splitLast(value), 2), other = _a[0], last = _a[1];
            multGroups.push(mult(__spreadArray(__spreadArray([], __read(other)), [{ op: '^', args: [last, unwrapNode(node, functionNames)] }])));
            return ['default'];
        },
        'group ^': function (node, value) {
            if (node == null)
                throw 'Unexpected end of input after ^';
            if (node === ' ')
                return ['group ^', value];
            multGroups.push({ op: '^', args: [value, unwrapNode(node, functionNames)] });
            return ['default'];
        },
        'func': function (node, name) {
            if (node == null)
                throw 'Unexpected end of input after function';
            if (node === ' ')
                return ['func', name];
            if (node === '^')
                return ['func ^', name];
            if (typeof node === 'object') {
                return ['func args', name, node.type === 'args' ? node.value : [node.value]];
            }
            else {
                return ['func numvars', name, assertIndependentNode(node, functionNames)];
            }
        },
        'func numvars': function (node, func, numvars) {
            if (node == null) {
                multGroups.push({ op: func, args: [numvars] });
                return ['default'];
            }
            if (typeof node !== 'object' && isIndependentNode(node, functionNames)) {
                return ['func numvars', func, { op: '*', args: [numvars, node] }];
            }
            multGroups.push({ op: func, args: [numvars] });
            return this.default(node);
        },
        'func ^': function (node, func) {
            if (node == null)
                throw 'Unexpected end of input after ^';
            if (node === ' ')
                return ['func ^', func];
            var ex = unwrapNode(node, functionNames);
            if (inverseExistingFunctions.has(func) && (ex === -1 || (typeof ex === 'object' && ex.op === '-@' && ex.args[0] === 1))) {
                throw "Ambiguous func^(-1)(x). Use 1/" + func + "(x), " + func + "(x)^(-1) or arc" + func + "(x)";
            }
            return ['func ^ ex', func, ex];
        },
        'func ^ ex': function (node, func, ex) {
            if (node == null)
                throw 'Unexpected end of input after func^ex. expected arguments';
            if (node === ' ')
                return ['func ^ ex', func, ex];
            if (typeof node !== 'object')
                throw 'Wrap function args with paren';
            var funcCall = { op: func, args: node.type === 'args' ? node.value : [node.value] };
            multGroups.push({ op: '^', args: [funcCall, ex] });
            return this.default(node);
        },
        'func args': function (node, func, args) {
            if (node == null) {
                multGroups.push({ op: func, args: args });
                return ['default'];
            }
            if (node === ' ')
                return ['func args', func, args];
            if (node === '^')
                return ['func args ^', func, args];
            var funcCall = { op: func, args: args };
            if (node === '!') {
                multGroups.push({ op: 'fact', args: [funcCall] });
                return ['default'];
            }
            else {
                multGroups.push(funcCall);
                return this.default(node);
            }
        },
        'func args ^': function (node, func, args) {
            if (node == null)
                throw 'Unexpected end of input after ^';
            if (node === ' ')
                return ['func args ^', func, args];
            var funcCall = { op: func, args: args };
            multGroups.push({ op: '^', args: [funcCall, unwrapNode(node, functionNames)] });
            return ['default'];
        }
    };
    var state = ['default'];
    try {
        for (var _b = __values(__spreadArray(__spreadArray([], __read(values)), [null])), _c = _b.next(); !_c.done; _c = _b.next()) {
            var node = _c.value;
            var _d = __read(state), mode = _d[0], args = _d.slice(1);
            state = consumer[mode].apply(consumer, __spreadArray([node], __read(args)));
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_3) throw e_3.error; }
    }
    return multGroups;
}
function splitByOp(items, op) {
    var e_4, _a;
    var output = [];
    try {
        for (var items_1 = __values(items), items_1_1 = items_1.next(); !items_1_1.done; items_1_1 = items_1.next()) {
            var item = items_1_1.value;
            if (op.includes(item)) {
                output.push([item, []]);
            }
            else {
                if (output.length === 0)
                    output.push([null, []]);
                output[output.length - 1][1].push(item);
            }
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (items_1_1 && !items_1_1.done && (_a = items_1.return)) _a.call(items_1);
        }
        finally { if (e_4) throw e_4.error; }
    }
    return output;
}
function splitMultDiv(group, functionNames) {
    var result = splitByOp(group, ['*', '/']).reduce(function (ast, _a) {
        var _b = __read(_a, 2), op = _b[0], group = _b[1];
        if (group.length === 0)
            throw "No Right Hand Side: " + op;
        if (ast == null && op != null)
            throw "No Left Hand Side: " + op;
        var nodes = buildFuncMultPowBang(group, functionNames);
        if (op === '/')
            ast = { op: '/', args: [ast, nodes.shift()] };
        var rhs = nodes.length ? nodes.reduce(function (a, b) { return ({ op: '*', args: [a, b] }); }) : null;
        if (ast && rhs)
            return { op: '*', args: [ast, rhs] };
        return ast !== null && ast !== void 0 ? ast : rhs;
    }, null);
    if (result == null)
        throw 'Unexpected Empty Group';
    return result;
}
function splitPlusMinus(group, functionNames) {
    var result = splitByOp(group, ['+', '-']).reduce(function (ast, _a) {
        var _b = __read(_a, 2), op = _b[0], group = _b[1];
        if (group.length === 0)
            throw "No Right Hand Side: " + op;
        var rhs = splitMultDiv(group, functionNames);
        if (ast === null)
            return op === '-' ? { op: '-@', args: [rhs] } : rhs;
        return { op: op === '-' ? '-' : '+', args: [ast, rhs] };
    }, null);
    if (result == null)
        throw 'Unexpected Empty Group';
    return result;
}
function buildAST(group, functionNames) {
    var e_5, _a;
    var current = [];
    var out = [current];
    try {
        for (var group_1 = __values(group), group_1_1 = group_1.next(); !group_1_1.done; group_1_1 = group_1.next()) {
            var item = group_1_1.value;
            if (item == ',')
                out.push(current = []);
            else
                current.push(item);
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (group_1_1 && !group_1_1.done && (_a = group_1.return)) _a.call(group_1);
        }
        finally { if (e_5) throw e_5.error; }
    }
    var astNodes = out.map(function (g) { return splitPlusMinus(g, functionNames); });
    if (astNodes.length === 1)
        return astNodes[0];
    return astNodes;
}
