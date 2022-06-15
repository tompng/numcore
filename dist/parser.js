"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.predefinedFunctionNames = void 0;
exports.predefinedFunctionNames = new Set([
    'log', 'exp', 'sqrt', 'pow', 'hypot', 'sin', 'cos', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh', 'atan2', '√', 'abs', 'min', 'max',
    'arcsin', 'arccos', 'arctan', 'arctanh', 'arccosh', 'arcsinh',
    'floor', 'ceil', 'round', 'sgn', 'sign', 'signum', 'fact', 'factorial',
]);
const comparers = new Set(['<', '=', '>', '<=', '>=', '≤', '≥']);
const comparerAlias = { '≤': '<=', '≥': '>=' };
const operators = new Set(['+', '-', '*', '/', '^', '**', '!', '・', '×', '÷']);
const alias = {
    '・': '*', '×': '*', '÷': '/', '**': '^', '√': 'sqrt',
    'arcsin': 'asin', 'arccos': 'acos', 'arctan': 'atan',
    'arctanh': 'atanh', 'arccosh': 'acosh', 'arcsinh': 'asinh',
    'π': 'pi', 'th': 'theta', 'θ': 'theta', 'φ': 'phi',
    'sgn': 'sign', 'signum': 'sign', 'factorial': 'fact',
};
const tokenSet = new Set([...exports.predefinedFunctionNames, ...Object.keys(alias), ...operators, ...comparers, ',', ' ']);
function parseParen(input) {
    const stack = [{ abs: false, group: [] }];
    let current = stack[stack.length - 1];
    const push = (abs) => {
        const group = [];
        current.group.push(group);
        stack.push(current = { abs, group });
    };
    const pop = (abs) => {
        const last = stack.pop();
        if (last.abs !== abs)
            throw 'Absolute Paren Mismatch';
        if (stack.length === 0)
            throw 'Paren Mismatch';
        current = stack[stack.length - 1];
    };
    for (const c of input) {
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
    if (stack.length !== 1)
        throw 'Paren Mismatch';
    return current.group;
}
function convertAlias(s) {
    return alias[s] || s;
}
function matchToken(s, i, tokens) {
    if (s[i].match(/\d/)) {
        let len = 1;
        let dotCount = 0;
        while (i + len < s.length && (s[i + len].match(/\d/) || (dotCount === 0 && s[i + len] === '.'))) {
            if (s[i + len] === '.')
                dotCount++;
            len++;
        }
        return [parseFloat(s.substr(i, len)), len];
    }
    for (let len = tokens.max; len >= 1; len -= 1) {
        if (tokens.set.has(s.substr(i, len)))
            return [convertAlias(s.substr(i, len)), len];
    }
    return null;
}
function tokenize(group, tokens) {
    const out = [];
    const pattern = group.map(s => typeof s === 'string' ? s : '@').join('');
    for (let i = 0; i < group.length;) {
        const item = group[i];
        if (item === ' ') {
            if (out[out.length - 1] !== item)
                out.push(item);
            i += 1;
        }
        else if (typeof item === 'string') {
            const result = matchToken(pattern, i, tokens);
            if (!result)
                throw `Unexpected Token "${pattern[i]}"`;
            const [v, len] = result;
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
    const pg = parseParen(s.replace(/\s/g, ' '));
    const tokens = { set: new Set(tokenSet), max: 0 };
    const functions = new Set(exports.predefinedFunctionNames);
    if (extraVariables)
        extraVariables.forEach(t => tokens.set.add(t));
    if (extraFunctions)
        extraFunctions.forEach(t => {
            tokens.set.add(t);
            functions.add(t);
        });
    for (const t of tokens.set) {
        if (tokens.max < t.length)
            tokens.max = t.length;
    }
    const tg = tokenize(pg, tokens);
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
    const idx = group.findIndex(item => typeof item === 'string' && comparers.has(item));
    if (idx === -1) {
        const ast = buildAST(group, functionNames);
        if (Array.isArray(ast))
            throw 'Unexpected comma';
        return [ast, null];
    }
    const cmp = group[idx];
    const compareMode = ((_a = comparerAlias[cmp]) !== null && _a !== void 0 ? _a : cmp);
    const left = buildAST(group.slice(0, idx), functionNames);
    const right = buildAST(group.slice(idx + 1), functionNames);
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
const oplist = [new Set(['+', '-']), new Set(['*', '/'])];
function assertIndependentNode(node, functionNames) {
    if (typeof node === 'string') {
        if (node === '!' || node === '^')
            throw 'Unexpected operator. Wrap with paren.';
        if (functionNames && functionNames.has(node))
            throw 'Unexpected function. Wrap with paren.';
    }
    return node;
}
const inverseExistingFunctions = new Set(['sin', 'cos', 'tan', 'sinh', 'cosh', 'tanh']);
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
    const values = group.map(g => {
        if (typeof g !== 'object')
            return g;
        const astOrArg = buildAST(g, functionNames);
        return Array.isArray(astOrArg) ? { type: 'args', value: astOrArg } : { type: 'paren', value: astOrArg };
    });
    function mult(nodes) { return nodes.reduce((a, b) => ({ op: '*', args: [a, b] })); }
    function splitLast(item) {
        return [item.slice(0, item.length - 1), item[item.length - 1]];
    }
    function isFunction(node) {
        return typeof node === 'string' && functionNames.has(node);
    }
    const multGroups = [];
    const consumer = {
        'default'(node) {
            if (node == null)
                return ['default'];
            if (node === ' ')
                return ['default'];
            if (typeof node === 'string' && isFunction(node)) {
                if (node.match(/WithSubscript$/))
                    return ['subfunc', node];
                return ['func', node, []];
            }
            if (typeof node === 'object') {
                return ['group', unwrapNode(node, functionNames)];
            }
            return ['numvars', [unwrapNode(node, functionNames)]];
        },
        'numvars'(node, value) {
            if (node == null || isFunction(node) || typeof node === 'object') {
                multGroups.push(mult(value));
                return this.default(node);
            }
            if (node === ' ')
                return ['numvars ', value];
            if (node === '^')
                return ['numvars ^', value];
            if (node === '!') {
                const [other, last] = splitLast(value);
                multGroups.push(mult([...other, { op: 'fact', args: [last] }]));
                return ['default'];
            }
            return ['numvars', [...value, unwrapNode(node, functionNames)]];
        },
        'numvars '(node, value) {
            if (node === ' ' || node === '^' || node === '!')
                return this['numvars'](node, value);
            this['numvars'](null, value);
            return this.default(node);
        },
        'group'(node, value) {
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
        'numvars ^'(node, value) {
            if (node == null)
                throw 'Unexpected end of input after ^';
            if (node === ' ')
                return ['numvars ^', value];
            const [other, last] = splitLast(value);
            multGroups.push(mult([...other, { op: '^', args: [last, unwrapNode(node, functionNames)] }]));
            return ['default'];
        },
        'group ^'(node, value) {
            if (node == null)
                throw 'Unexpected end of input after ^';
            if (node === ' ')
                return ['group ^', value];
            multGroups.push({ op: '^', args: [value, unwrapNode(node, functionNames)] });
            return ['default'];
        },
        'subfunc'(node, name) {
            if (node === ' ')
                return ['subfunc', name];
            if (node === '^')
                throw `Unexpected "^" in subscript of "${name}"`;
            if (node == null)
                throw `Unexpected end of input after subscript of "${name}"`;
            if (typeof node === 'object') {
                if (node.type === 'args')
                    throw `Unexpected comma in subscript of "${name}"`;
                return ['func', name, [node.value]];
            }
            else {
                return ['func', name, [node]];
            }
        },
        'func'(node, name, decorators) {
            if (node == null)
                throw 'Unexpected end of input after function';
            if (node === ' ')
                return ['func', name, decorators];
            if (node === '^')
                return ['func ^', name, decorators];
            if (typeof node === 'object') {
                return ['func args', name, node.type === 'args' ? [...decorators, ...node.value] : [...decorators, node.value]];
            }
            else {
                return ['func numvars', name, decorators, assertIndependentNode(node, functionNames)];
            }
        },
        'func numvars'(node, func, decorators, numvars) {
            if (node == null) {
                multGroups.push({ op: func, args: [...decorators, numvars] });
                return ['default'];
            }
            if (typeof node !== 'object' && isIndependentNode(node, functionNames)) {
                return ['func numvars', func, decorators, { op: '*', args: [numvars, node] }];
            }
            multGroups.push({ op: func, args: [...decorators, numvars] });
            return this.default(node);
        },
        'func ^'(node, func, decorators) {
            if (node == null)
                throw 'Unexpected end of input after ^';
            if (node === ' ')
                return ['func ^', func, decorators];
            const ex = unwrapNode(node, functionNames);
            if (inverseExistingFunctions.has(func) && (ex === -1 || (typeof ex === 'object' && ex.op === '-@' && ex.args[0] === 1))) {
                throw `Ambiguous func^(-1)(x). Use 1/${func}(x), ${func}(x)^(-1) or arc${func}(x)`;
            }
            return ['func ^ ex', func, decorators, ex];
        },
        'func ^ ex'(node, func, decorators, ex) {
            if (node == null)
                throw 'Unexpected end of input after func^ex. expected arguments';
            if (node === ' ')
                return ['func ^ ex', func, decorators, ex];
            if (typeof node !== 'object')
                throw 'Wrap function args with paren';
            const funcCall = { op: func, args: node.type === 'args' ? [...decorators, ...node.value] : [...decorators, node.value] };
            multGroups.push({ op: '^', args: [funcCall, ex] });
            return ['default'];
        },
        'func args'(node, func, args) {
            if (node == null) {
                multGroups.push({ op: func, args });
                return ['default'];
            }
            if (node === ' ')
                return ['func args', func, args];
            if (node === '^')
                return ['func args ^', func, args];
            const funcCall = { op: func, args };
            if (node === '!') {
                multGroups.push({ op: 'fact', args: [funcCall] });
                return ['default'];
            }
            else {
                multGroups.push(funcCall);
                return this.default(node);
            }
        },
        'func args ^'(node, func, args) {
            if (node == null)
                throw 'Unexpected end of input after ^';
            if (node === ' ')
                return ['func args ^', func, args];
            const funcCall = { op: func, args };
            multGroups.push({ op: '^', args: [funcCall, unwrapNode(node, functionNames)] });
            return ['default'];
        }
    };
    let state = ['default'];
    for (const node of [...values, null]) {
        const [mode, ...args] = state;
        state = consumer[mode](node, ...args);
    }
    return multGroups;
}
function splitByOp(items, op) {
    const output = [];
    for (const item of items) {
        if (op.includes(item)) {
            output.push([item, []]);
        }
        else {
            if (output.length === 0)
                output.push([null, []]);
            output[output.length - 1][1].push(item);
        }
    }
    return output;
}
function splitMultDiv(group, functionNames) {
    const result = splitByOp(group, ['*', '/']).reduce((ast, [op, group]) => {
        if (group.length === 0)
            throw `No Right Hand Side: ${op}`;
        if (ast == null && op != null)
            throw `No Left Hand Side: ${op}`;
        const nodes = buildFuncMultPowBang(group, functionNames);
        if (op === '/')
            ast = { op: '/', args: [ast, nodes.shift()] };
        const rhs = nodes.length ? nodes.reduce((a, b) => ({ op: '*', args: [a, b] })) : null;
        if (ast != null && rhs != null)
            return { op: '*', args: [ast, rhs] };
        return ast !== null && ast !== void 0 ? ast : rhs;
    }, null);
    if (result == null)
        throw 'Unexpected Empty Group';
    return result;
}
function splitPlusMinus(group, functionNames) {
    const result = splitByOp(group, ['+', '-']).reduce((ast, [op, group]) => {
        if (group.length === 0)
            throw `No Right Hand Side: ${op}`;
        const rhs = splitMultDiv(group, functionNames);
        if (ast === null)
            return op === '-' ? { op: '-@', args: [rhs] } : rhs;
        return { op: op === '-' ? '-' : '+', args: [ast, rhs] };
    }, null);
    if (result == null)
        throw 'Unexpected Empty Group';
    return result;
}
function buildAST(group, functionNames) {
    let current = [];
    const out = [current];
    for (let item of group) {
        if (item == ',')
            out.push(current = []);
        else
            current.push(item);
    }
    const astNodes = out.map(g => splitPlusMinus(g, functionNames));
    if (astNodes.length === 1)
        return astNodes[0];
    return astNodes;
}
