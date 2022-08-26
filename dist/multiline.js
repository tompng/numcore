"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presets3D = exports.presets2D = exports.astToRangeFunctionCode = exports.astToValueFunctionCode = exports.parseMultiple = exports.epsilon = void 0;
const parser_1 = require("./parser");
const ast_1 = require("./ast");
const expander_1 = require("./expander");
const factorial_1 = require("./factorial");
const util_1 = require("./util");
exports.epsilon = 1e-15;
const partials = Object.assign({}, factorial_1.partials);
function embedRequiredPartials(code) {
    var _a;
    const pattern = /\/\* *REQUIRE *\([\w ]*\) *\*\//g;
    const trimmed = code.replace(pattern, '');
    const matches = (_a = code.match(pattern)) !== null && _a !== void 0 ? _a : [];
    const requires = matches.flatMap(m => { var _a; return (_a = m.match(/\((.*)\)/)[0].match(/\w+/g)) !== null && _a !== void 0 ? _a : []; });
    const requiredCodes = [...new Set(requires)].map(name => {
        const code = partials[name];
        if (!code)
            throw `require error: ${name}`;
        return code;
    });
    return [...requiredCodes, trimmed].join(';');
}
function parseMultiple(formulaTexts, argNames, presets) {
    const uniq = new util_1.UniqASTGenerator();
    const predefinedVars = new Set(argNames);
    const varNames = new Set(predefinedVars);
    const varDefRegexp = /^ *([a-zA-Zα-ωΑ-Ω]+) *(\( *[a-zA-Zα-ωΑ-Ω]+(?: *, *[a-zA-Zα-ωΑ-Ω]+)* *\))? *=(.*)/;
    const funcNames = new Set(parser_1.predefinedFunctionNames);
    presets = Object.assign(Object.assign({}, defaultPresets), presets);
    for (const name in presets) {
        if (Array.isArray(presets[name])) {
            funcNames.add(name);
        }
        else {
            varNames.add(name);
        }
    }
    const maybeKeywords = [];
    for (const f of formulaTexts) {
        const match = f.match(varDefRegexp);
        if (match)
            maybeKeywords.push(match[1]);
    }
    const keywordsSet = guessKeywords(maybeKeywords, [...varNames, ...funcNames]);
    for (const f of formulaTexts) {
        const match = f.match(varDefRegexp);
        if (!match)
            continue;
        const [_, name, args] = match;
        if (!keywordsSet.has(name))
            continue;
        if (funcNames.has(name) || varNames.has(name))
            continue;
        if (args)
            funcNames.add(name);
        else
            varNames.add(name);
    }
    const vars = new Map();
    const funcs = new Map();
    function addVar(name, body) {
        let definition;
        if (typeof body === 'number') {
            definition = { type: 'var', name, ast: body, deps: [] };
        }
        else {
            try {
                const [ast, mode] = parser_1.parse(body, varNames, funcNames);
                const deps = ast_1.extractVariables(ast);
                definition = { type: 'var', name, deps, ast: uniq.convert(ast) };
            }
            catch (e) {
                definition = { type: 'var', name, deps: [], ast: null, error: String(e) };
            }
        }
        vars.set(name, definition);
        return definition;
    }
    function addFunc(name, args, body) {
        let definition;
        try {
            const [ast, mode] = parser_1.parse(body, new Set([...varNames, ...args]), funcNames);
            if (mode != null)
                throw `Unexpected compare operator`;
            const duplicateArgs = duplicates(args);
            if (duplicateArgs.length !== 0)
                throw `Duplicated argument name: ${JSON.stringify(duplicateArgs)}`;
            const variables = ast_1.extractVariables(ast).filter(n => !args.includes(n));
            const deps = [...variables, ...ast_1.extractFunctions(ast, funcNames)];
            definition = { type: 'func', name, deps, args, ast: uniq.convert(ast) };
        }
        catch (e) {
            definition = { type: 'func', name, deps: [], args, ast: null, error: String(e) };
        }
        funcs.set(name, definition);
        return definition;
    }
    if (presets) {
        for (const name in presets) {
            const value = presets[name];
            if (Array.isArray(value)) {
                const [args, body] = value;
                addFunc(name, args, body);
            }
            else {
                addVar(name, value);
            }
        }
    }
    const formulas = formulaTexts.map(f => {
        const match = f.match(varDefRegexp);
        const name = match === null || match === void 0 ? void 0 : match[1];
        if (!match || !name || !keywordsSet.has(name) || vars.has(name) || funcs.has(name) || predefinedVars.has(name) || parser_1.predefinedFunctionNames.has(name)) {
            try {
                const [ast, mode] = parser_1.parse(f, varNames, funcNames);
                const deps = ast_1.extractVariables(ast);
                return { type: 'eq', mode, deps, ast: uniq.convert(ast) };
            }
            catch (e) {
                return { type: 'eq', mode: null, deps: [], ast: null, error: String(e) };
            }
        }
        const argpart = match[2];
        const body = match[3];
        if (argpart) {
            const args = argpart.substring(1, argpart.length - 1).split(',').map(s => s.trim());
            return addFunc(name, args, body);
        }
        else {
            return addVar(name, body);
        }
    });
    const defs = new Map([...vars.entries(), ...funcs.entries()]);
    recursiveCheck(formulas, defs);
    const preEvaluateResults = new Map();
    return formulas.map(f => {
        if (!f.ast || f.error)
            return f;
        if (f.type === 'func')
            return f;
        try {
            const expandedAST = ast_1.preEvaluateAST(expandAST(f.ast, vars, funcs, uniq), uniq, preEvaluateResults);
            return Object.assign(Object.assign({}, f), { ast: expandedAST });
        }
        catch (e) {
            return Object.assign(Object.assign({}, f), { ast: null, error: String(e) });
        }
    });
}
exports.parseMultiple = parseMultiple;
function guessKeywords(maybeKeywords, keywords) {
    const keywordSet = new Set();
    const sizeSet = new Set();
    const sizes = [];
    function add(kw) {
        keywordSet.add(kw);
        if (!sizeSet.has(kw.length)) {
            sizeSet.add(kw.length);
            sizes.push(kw.length);
            sizes.sort((a, b) => b - a);
        }
    }
    function match(maybeKeyword) {
        let idx = 0;
        let len = maybeKeyword.length;
        while (len > 0) {
            let matched = 0;
            for (const s of sizes) {
                if (s > len)
                    continue;
                if (keywordSet.has(maybeKeyword.substr(idx, s))) {
                    matched = s;
                    break;
                }
            }
            if (matched == 0)
                return false;
            idx += matched;
            len -= matched;
        }
        return true;
    }
    for (const kw of keywords)
        add(kw);
    for (const kw of [...maybeKeywords].sort((a, b) => a.length - b.length)) {
        if (!match(kw))
            add(kw);
    }
    return keywordSet;
}
function recursiveCheck(formulas, defs) {
    const rec = new Set();
    function check(formula) {
        if (formula.error)
            return;
        if (formula.type !== 'eq') {
            if (rec.has(formula.name)) {
                formula.error = `cannot define recursively: ${formula.name}`;
                formula.ast = null;
                return;
            }
            rec.add(formula.name);
        }
        for (const n of formula.deps) {
            const d = defs.get(n);
            if (d)
                check(d);
        }
        const errorDep = formula.deps.find(n => { var _a; return (_a = defs.get(n)) === null || _a === void 0 ? void 0 : _a.error; });
        if (errorDep) {
            formula.error = formula.error || `${errorDep} is not defined`;
            formula.ast = null;
        }
        if (formula.type !== 'eq')
            rec.delete(formula.name);
    }
    for (const f of formulas)
        check(f);
}
function expandAST(ast, vars, funcs, uniq) {
    const expandeds = new Map();
    function expand(ast) {
        const output = expandeds.get(ast);
        if (output)
            return output;
        if (typeof ast === 'number')
            return ast;
        if (typeof ast === 'string') {
            const vdef = vars.get(ast);
            if ((vdef === null || vdef === void 0 ? void 0 : vdef.ast) == null)
                return ast;
            return expandAST(vdef.ast, vars, funcs, uniq);
        }
        const args = ast.args.map(arg => expandAST(arg, vars, funcs, uniq));
        const fdef = funcs.get(ast.op);
        let expanded;
        if ((fdef === null || fdef === void 0 ? void 0 : fdef.ast) == null) {
            expanded = uniq.create(ast.op, args);
        }
        else {
            if (args.length !== fdef.args.length)
                throw `Wrong number of arguments for ${fdef.name}(${fdef.args.join(',')})`;
            const argVars = new Map(fdef.args.map((name, i) => [name, args[i]]));
            const argReplaced = replaceUniqAST(fdef.ast, argVars, uniq);
            expanded = expand(argReplaced);
        }
        return expanded;
    }
    return expand(ast);
}
function replaceUniqAST(ast, converts, uniq) {
    const replaceds = new Map();
    function replace(ast) {
        const output = replaceds.get(ast);
        if (output)
            return output;
        const ast2 = converts.get(ast);
        if (ast2 != null)
            return ast2;
        if (typeof ast !== 'object')
            return ast;
        const replaced = uniq.create(ast.op, ast.args.map(arg => replaceUniqAST(arg, converts, uniq)));
        replaceds.set(ast, replaced);
        return replaced;
    }
    return replace(ast);
}
function extractReusedAST(ast) {
    const set = new Set();
    const reused = new Set();
    function extractDups(ast) {
        if (typeof ast !== 'object')
            return;
        if (set.has(ast)) {
            reused.add(ast);
            return;
        }
        set.add(ast);
        for (const arg of ast.args)
            extractDups(arg);
    }
    extractDups(ast);
    let astCnt = 0;
    const astId = new Map();
    function indexAst(ast) {
        if (astId.has(ast) || typeof ast !== 'object')
            return;
        ast.args.forEach(indexAst);
        astId.set(ast, astCnt++);
    }
    indexAst(ast);
    return [...reused].sort((a, b) => astId.get(a) - astId.get(b));
}
function toProcedure(ast) {
    const reuseds = extractReusedAST(ast);
    const converts = new Map(reuseds.map((ast, i) => [ast, `_v${i}`]));
    const replaceds = new Map();
    function replace(ast, root) {
        var _a;
        const ast2 = root ? null : (_a = replaceds.get(ast)) !== null && _a !== void 0 ? _a : converts.get(ast);
        if (ast2 != null)
            return ast2;
        if (typeof ast !== 'object')
            return ast;
        const replaced = { op: ast.op, args: ast.args.map(arg => replace(arg)) };
        if (!root)
            replaceds.set(ast, replaced);
        return replaced;
    }
    const vars = new Map();
    for (const vast of reuseds) {
        const name = converts.get(vast);
        vars.set(name, replace(vast, true));
    }
    return [vars, replace(ast, true)];
}
function astToValueFunctionCode(uniqAST, args) {
    const [vars, rast] = toProcedure(uniqAST);
    const varNames = new Set([...args, ...vars.keys()]);
    const codes = [...vars.entries()].map(([name, ast]) => `const ${name}=${ast_1.astToCode(ast, varNames)}`);
    const rcode = ast_1.astToCode(rast, varNames);
    return embedRequiredPartials(`(${args.join(',')})=>{${codes.join('\n')}\nreturn ${rcode}}`);
}
exports.astToValueFunctionCode = astToValueFunctionCode;
function astToRangeFunctionCode(uniqAST, args, option) {
    const [tempVars, returnAST] = toProcedure(uniqAST);
    const namer = util_1.createNameGenerator();
    const vars = {};
    for (const arg of args)
        vars[arg] = [arg + 'min', arg + 'max'];
    const codes = [...tempVars.entries()].map(([name, ast]) => {
        const [result, code] = ast_1.astToRangeVarNameCode(ast, vars, expander_1.expanders, namer);
        if (typeof result === 'number') {
            const varname = namer();
            vars[name] = [varname, varname]; // Must not happen?
            return `const ${varname}=${result}`;
        }
        else {
            vars[name] = result;
            return code;
        }
    });
    const [result, rcode] = ast_1.astToRangeVarNameCode(returnAST, vars, expander_1.expanders, namer);
    const argsPart = `(${args.map(a => `${a}min,${a}max`).join(',')})`;
    if (typeof result === 'number') {
        const val = isNaN(result) ? util_1.RangeResults.EQNAN : result < -exports.epsilon ? util_1.RangeResults.NEGATIVE : result > exports.epsilon ? util_1.RangeResults.POSITIVE : util_1.RangeResults.EQZERO;
        return `${argsPart}=>${val}`;
    }
    const fullCode = [...codes, rcode].join('\n');
    const gapTest = fullCode.includes(expander_1.GAPMARK);
    const nanTest = fullCode.includes(expander_1.NANMARK);
    const gapPrepare = gapTest ? 'let _gap=false;' : '';
    const nanPrepare = nanTest ? 'let _nan=false;' : '';
    const preparePart = gapPrepare + nanPrepare;
    const [minvar, maxvar] = result;
    const markEmbeddedCode = fullCode.replaceAll(expander_1.GAPMARK, '_gap=true;').replaceAll(expander_1.NANMARK, '_nan=true;');
    const gapRetPart = gapTest ? `_gap?${util_1.RangeResults.HASGAP}:` : '';
    const nanRetPart = nanTest ? `_nan?${util_1.RangeResults.HASNAN}:` : '';
    const zeroRetPart = option.zero ? `${minvar}>-${exports.epsilon}&&${maxvar}<${exports.epsilon}?${util_1.RangeResults.EQZERO}:` : '';
    const zeroRetPartWithNaN = option.zero ? `${minvar}>-${exports.epsilon}&&${maxvar}<${exports.epsilon}?${nanRetPart}${util_1.RangeResults.EQZERO}:` : '';
    const cmpEpsilon = option.eq ? -exports.epsilon : exports.epsilon;
    let returnPart;
    if (option.pos && option.neg) {
        returnPart = `return ${nanRetPart}${minvar}>${exports.epsilon}?${util_1.RangeResults.POSITIVE}:${maxvar}<${-exports.epsilon}?${util_1.RangeResults.NEGATIVE}:${zeroRetPart}${gapRetPart}${util_1.RangeResults.BOTH}`;
    }
    else if (option.pos) {
        returnPart = `return ${minvar}>${cmpEpsilon}?${nanRetPart}${util_1.RangeResults.POSITIVE}:${maxvar}<${cmpEpsilon}?${util_1.RangeResults.OTHER}:${gapRetPart}${util_1.RangeResults.BOTH}`;
    }
    else if (option.neg) {
        returnPart = `return ${maxvar}<${-cmpEpsilon}?${nanRetPart}${util_1.RangeResults.NEGATIVE}:${minvar}>${-cmpEpsilon}?${util_1.RangeResults.OTHER}:${gapRetPart}${util_1.RangeResults.BOTH}`;
    }
    else {
        returnPart = `return ${minvar}>${exports.epsilon}||${maxvar}<${-exports.epsilon}?${util_1.RangeResults.OTHER}:${zeroRetPartWithNaN}${gapRetPart}${util_1.RangeResults.BOTH}`;
    }
    return embedRequiredPartials(`${argsPart}=>{${preparePart}${markEmbeddedCode};${returnPart}}`);
}
exports.astToRangeFunctionCode = astToRangeFunctionCode;
const defaultPresets = {
    pi: Math.PI,
    'π': Math.PI,
    e: Math.E,
    mod: [['x', 'y'], 'x-floor(x/y)*y'],
    tan: [['x'], 'sin(x)/cos(x)'],
    logWithSubscript: [['x', 'y'], 'log(y)/log(x)'],
    cot: [['x'], 'cos(x)/sin(x)'],
    sec: [['x'], '1/cos(x)'],
    csc: [['x'], '1/sin(x)'],
    cosec: [['x'], 'csc(x)'],
};
exports.presets2D = {
    r: 'hypot(x,y)',
    'θ': 'atan2(y,x)',
    theta: 'θ',
    th: 'θ',
};
exports.presets3D = {
    r: 'hypot(x,y,z)',
    'θ': 'atan2(y,x)',
    theta: 'θ',
    th: 'θ',
    φ: 'atan2(hypot(x,y),z)',
    phi: 'φ',
};
function duplicates(elements) {
    const dups = new Set();
    const visited = new Set();
    for (const el of elements) {
        if (visited.has(el))
            dups.add(el);
        visited.add(el);
    }
    return [...dups];
}
