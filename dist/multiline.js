"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
exports.presets3D = exports.presets2D = exports.astToRangeFunctionCode = exports.astToValueFunctionCode = exports.parseMultiple = exports.epsilon = void 0;
var parser_1 = require("./parser");
var ast_1 = require("./ast");
var expander_1 = require("./expander");
var factorial_1 = require("./factorial");
var util_1 = require("./util");
exports.epsilon = 1e-15;
var partials = __assign({}, factorial_1.partials);
function embedRequiredPartials(code) {
    var _a;
    var pattern = /\/\* *REQUIRE *\([\w ]*\) *\*\//g;
    var trimmed = code.replace(pattern, '');
    var matches = (_a = code.match(pattern)) !== null && _a !== void 0 ? _a : [];
    var requires = matches.flatMap(function (m) { var _a; return (_a = m.match(/\((.*)\)/)[0].match(/\w+/g)) !== null && _a !== void 0 ? _a : []; });
    var requiredCodes = __spreadArray([], __read(new Set(requires))).map(function (name) {
        var code = partials[name];
        if (!code)
            throw "require error: " + name;
        return code;
    });
    return __spreadArray(__spreadArray([], __read(requiredCodes)), [trimmed]).join(';');
}
function parseMultiple(formulaTexts, argNames, presets) {
    var e_1, _a, e_2, _b;
    var uniq = new util_1.UniqASTGenerator();
    var predefinedVars = new Set(argNames);
    var varNames = new Set(predefinedVars);
    var varDefRegexp = /^ *([a-zA-Zα-ωΑ-Ω]+) *(\( *[a-zA-Zα-ωΑ-Ω]+(?: *, *[a-zA-Zα-ωΑ-Ω]+)* *\))? *=(.*)/;
    var funcNames = new Set(parser_1.predefinedFunctionNames);
    presets = __assign(__assign({}, defaultPresets), presets);
    for (var name in presets) {
        if (Array.isArray(presets[name])) {
            funcNames.add(name);
        }
        else {
            varNames.add(name);
        }
    }
    var maybeKeywords = [];
    try {
        for (var formulaTexts_1 = __values(formulaTexts), formulaTexts_1_1 = formulaTexts_1.next(); !formulaTexts_1_1.done; formulaTexts_1_1 = formulaTexts_1.next()) {
            var f = formulaTexts_1_1.value;
            var match = f.match(varDefRegexp);
            if (match)
                maybeKeywords.push(match[1]);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (formulaTexts_1_1 && !formulaTexts_1_1.done && (_a = formulaTexts_1.return)) _a.call(formulaTexts_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    var keywordsSet = guessKeywords(maybeKeywords, __spreadArray(__spreadArray([], __read(varNames)), __read(funcNames)));
    try {
        for (var formulaTexts_2 = __values(formulaTexts), formulaTexts_2_1 = formulaTexts_2.next(); !formulaTexts_2_1.done; formulaTexts_2_1 = formulaTexts_2.next()) {
            var f = formulaTexts_2_1.value;
            var match = f.match(varDefRegexp);
            if (!match)
                continue;
            var _c = __read(match, 3), _ = _c[0], name = _c[1], args = _c[2];
            if (!keywordsSet.has(name))
                continue;
            if (args)
                funcNames.add(name);
            else
                varNames.add(name);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (formulaTexts_2_1 && !formulaTexts_2_1.done && (_b = formulaTexts_2.return)) _b.call(formulaTexts_2);
        }
        finally { if (e_2) throw e_2.error; }
    }
    var vars = new Map();
    var funcs = new Map();
    function addVar(name, body) {
        var definition;
        if (typeof body === 'number') {
            definition = { type: 'var', name: name, ast: body, deps: [] };
        }
        else {
            try {
                var _a = __read(parser_1.parse(body, varNames, funcNames), 2), ast = _a[0], mode = _a[1];
                var deps = ast_1.extractVariables(ast);
                definition = { type: 'var', name: name, deps: deps, ast: uniq.convert(ast) };
            }
            catch (e) {
                definition = { type: 'var', name: name, deps: [], ast: null, error: String(e) };
            }
        }
        vars.set(name, definition);
        return definition;
    }
    function addFunc(name, args, body) {
        var definition;
        try {
            var _a = __read(parser_1.parse(body, new Set(__spreadArray(__spreadArray([], __read(varNames)), __read(args))), funcNames), 2), ast = _a[0], mode = _a[1];
            if (mode != null)
                throw "invalid compare operator";
            var duplicateArgs = duplicates(args);
            if (duplicateArgs.length !== 0)
                throw "duplicate argument name: " + JSON.stringify(duplicateArgs);
            var variables = ast_1.extractVariables(ast).filter(function (n) { return !args.includes(n); });
            var deps = __spreadArray(__spreadArray([], __read(variables)), __read(ast_1.extractFunctions(ast, funcNames)));
            definition = { type: 'func', name: name, deps: deps, args: args, ast: uniq.convert(ast) };
        }
        catch (e) {
            definition = { type: 'func', name: name, deps: [], args: args, ast: null, error: String(e) };
        }
        funcs.set(name, definition);
        return definition;
    }
    if (presets) {
        for (var name in presets) {
            var value = presets[name];
            if (Array.isArray(value)) {
                var _d = __read(value, 2), args = _d[0], body = _d[1];
                addFunc(name, args, body);
            }
            else {
                addVar(name, value);
            }
        }
    }
    var formulas = formulaTexts.map(function (f) {
        var match = f.match(varDefRegexp);
        var name = match === null || match === void 0 ? void 0 : match[1];
        if (!match || !name || !keywordsSet.has(name) || vars.has(name) || funcs.has(name) || predefinedVars.has(name) || parser_1.predefinedFunctionNames.has(name)) {
            try {
                var _a = __read(parser_1.parse(f, varNames, funcNames), 2), ast = _a[0], mode = _a[1];
                var deps = ast_1.extractVariables(ast);
                return { type: 'eq', mode: mode, deps: deps, ast: uniq.convert(ast) };
            }
            catch (e) {
                return { type: 'eq', mode: null, deps: [], ast: null, error: String(e) };
            }
        }
        var argpart = match[2];
        var body = match[3];
        if (argpart) {
            var args = argpart.substring(1, argpart.length - 1).split(',').map(function (s) { return s.trim(); });
            return addFunc(name, args, body);
        }
        else {
            return addVar(name, body);
        }
    });
    var defs = new Map(__spreadArray(__spreadArray([], __read(vars.entries())), __read(funcs.entries())));
    recursiveCheck(formulas, defs);
    var preEvaluateResults = new Map();
    return formulas.map(function (f) {
        if (!f.ast || f.error)
            return f;
        if (f.type === 'func')
            return f;
        try {
            var expandedAST = ast_1.preEvaluateAST(expandAST(f.ast, vars, funcs, uniq), uniq, preEvaluateResults);
            return __assign(__assign({}, f), { ast: expandedAST });
        }
        catch (e) {
            return __assign(__assign({}, f), { ast: null, error: String(e) });
        }
    });
}
exports.parseMultiple = parseMultiple;
function guessKeywords(maybeKeywords, keywords) {
    var e_3, _a, e_4, _b;
    var keywordSet = new Set();
    var sizeSet = new Set();
    var sizes = [];
    function add(kw) {
        keywordSet.add(kw);
        if (!sizeSet.has(kw.length)) {
            sizeSet.add(kw.length);
            sizes.push(kw.length);
            sizes.sort(function (a, b) { return b - a; });
        }
    }
    function match(maybeKeyword) {
        var e_5, _a;
        var idx = 0;
        var len = maybeKeyword.length;
        while (len > 0) {
            var matched = 0;
            try {
                for (var sizes_1 = (e_5 = void 0, __values(sizes)), sizes_1_1 = sizes_1.next(); !sizes_1_1.done; sizes_1_1 = sizes_1.next()) {
                    var s = sizes_1_1.value;
                    if (s > len)
                        continue;
                    if (keywordSet.has(maybeKeyword.substr(idx, s))) {
                        matched = s;
                        break;
                    }
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (sizes_1_1 && !sizes_1_1.done && (_a = sizes_1.return)) _a.call(sizes_1);
                }
                finally { if (e_5) throw e_5.error; }
            }
            if (matched == 0)
                return false;
            idx += matched;
            len -= matched;
        }
        return true;
    }
    try {
        for (var keywords_1 = __values(keywords), keywords_1_1 = keywords_1.next(); !keywords_1_1.done; keywords_1_1 = keywords_1.next()) {
            var kw = keywords_1_1.value;
            add(kw);
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (keywords_1_1 && !keywords_1_1.done && (_a = keywords_1.return)) _a.call(keywords_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
    try {
        for (var _c = __values(__spreadArray([], __read(maybeKeywords)).sort(function (a, b) { return a.length - b.length; })), _d = _c.next(); !_d.done; _d = _c.next()) {
            var kw = _d.value;
            if (!match(kw))
                add(kw);
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
        }
        finally { if (e_4) throw e_4.error; }
    }
    return keywordSet;
}
function recursiveCheck(formulas, defs) {
    var e_6, _a;
    var rec = new Set();
    function check(formula) {
        var e_7, _a;
        if (formula.error)
            return;
        if (formula.type !== 'eq') {
            if (rec.has(formula.name)) {
                formula.error = "cannot define recursively: " + formula.name;
                formula.ast = null;
                return;
            }
            rec.add(formula.name);
        }
        try {
            for (var _b = __values(formula.deps), _c = _b.next(); !_c.done; _c = _b.next()) {
                var n = _c.value;
                var d = defs.get(n);
                if (d)
                    check(d);
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_7) throw e_7.error; }
        }
        var errorDep = formula.deps.find(function (n) { var _a; return (_a = defs.get(n)) === null || _a === void 0 ? void 0 : _a.error; });
        if (errorDep) {
            formula.error = formula.error || errorDep + " is not defined";
            formula.ast = null;
        }
        if (formula.type !== 'eq')
            rec.delete(formula.name);
    }
    try {
        for (var formulas_1 = __values(formulas), formulas_1_1 = formulas_1.next(); !formulas_1_1.done; formulas_1_1 = formulas_1.next()) {
            var f = formulas_1_1.value;
            check(f);
        }
    }
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (formulas_1_1 && !formulas_1_1.done && (_a = formulas_1.return)) _a.call(formulas_1);
        }
        finally { if (e_6) throw e_6.error; }
    }
}
function expandAST(ast, vars, funcs, uniq) {
    var expandeds = new Map();
    function expand(ast) {
        var output = expandeds.get(ast);
        if (output)
            return output;
        if (typeof ast === 'number')
            return ast;
        if (typeof ast === 'string') {
            var vdef = vars.get(ast);
            if ((vdef === null || vdef === void 0 ? void 0 : vdef.ast) == null)
                return ast;
            return expandAST(vdef.ast, vars, funcs, uniq);
        }
        var args = ast.args.map(function (arg) { return expandAST(arg, vars, funcs, uniq); });
        var fdef = funcs.get(ast.op);
        var expanded;
        if ((fdef === null || fdef === void 0 ? void 0 : fdef.ast) == null) {
            expanded = uniq.create(ast.op, args);
        }
        else {
            if (args.length !== fdef.args.length)
                throw "Wrong number of arguments for " + fdef.name + "(" + fdef.args.join(',') + ")";
            var argVars = new Map(fdef.args.map(function (name, i) { return [name, args[i]]; }));
            var argReplaced = replaceUniqAST(fdef.ast, argVars, uniq);
            expanded = expand(argReplaced);
        }
        return expanded;
    }
    return expand(ast);
}
function replaceUniqAST(ast, converts, uniq) {
    var replaceds = new Map();
    function replace(ast) {
        var output = replaceds.get(ast);
        if (output)
            return output;
        var ast2 = converts.get(ast);
        if (ast2 != null)
            return ast2;
        if (typeof ast !== 'object')
            return ast;
        var replaced = uniq.create(ast.op, ast.args.map(function (arg) { return replaceUniqAST(arg, converts, uniq); }));
        replaceds.set(ast, replaced);
        return replaced;
    }
    return replace(ast);
}
function extractReusedAST(ast) {
    var set = new Set();
    var reused = new Set();
    function extractDups(ast) {
        var e_8, _a;
        if (typeof ast !== 'object')
            return;
        if (set.has(ast)) {
            reused.add(ast);
            return;
        }
        set.add(ast);
        try {
            for (var _b = __values(ast.args), _c = _b.next(); !_c.done; _c = _b.next()) {
                var arg = _c.value;
                extractDups(arg);
            }
        }
        catch (e_8_1) { e_8 = { error: e_8_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_8) throw e_8.error; }
        }
    }
    extractDups(ast);
    var astCnt = 0;
    var astId = new Map();
    function indexAst(ast) {
        if (astId.has(ast) || typeof ast !== 'object')
            return;
        ast.args.forEach(indexAst);
        astId.set(ast, astCnt++);
    }
    indexAst(ast);
    return __spreadArray([], __read(reused)).sort(function (a, b) { return astId.get(a) - astId.get(b); });
}
function toProcedure(ast) {
    var e_9, _a;
    var reuseds = extractReusedAST(ast);
    var converts = new Map(reuseds.map(function (ast, i) { return [ast, "_v" + i]; }));
    var replaceds = new Map();
    function replace(ast, root) {
        var _a;
        var ast2 = root ? null : (_a = replaceds.get(ast)) !== null && _a !== void 0 ? _a : converts.get(ast);
        if (ast2 != null)
            return ast2;
        if (typeof ast !== 'object')
            return ast;
        var replaced = { op: ast.op, args: ast.args.map(function (arg) { return replace(arg); }) };
        if (!root)
            replaceds.set(ast, replaced);
        return replaced;
    }
    var vars = new Map();
    try {
        for (var reuseds_1 = __values(reuseds), reuseds_1_1 = reuseds_1.next(); !reuseds_1_1.done; reuseds_1_1 = reuseds_1.next()) {
            var vast = reuseds_1_1.value;
            var name = converts.get(vast);
            vars.set(name, replace(vast, true));
        }
    }
    catch (e_9_1) { e_9 = { error: e_9_1 }; }
    finally {
        try {
            if (reuseds_1_1 && !reuseds_1_1.done && (_a = reuseds_1.return)) _a.call(reuseds_1);
        }
        finally { if (e_9) throw e_9.error; }
    }
    return [vars, replace(ast, true)];
}
function astToValueFunctionCode(uniqAST, args) {
    var _a = __read(toProcedure(uniqAST), 2), vars = _a[0], rast = _a[1];
    var varNames = new Set(__spreadArray(__spreadArray([], __read(args)), __read(vars.keys())));
    var codes = __spreadArray([], __read(vars.entries())).map(function (_a) {
        var _b = __read(_a, 2), name = _b[0], ast = _b[1];
        return "const " + name + "=" + ast_1.astToCode(ast, varNames);
    });
    var rcode = ast_1.astToCode(rast, varNames);
    return embedRequiredPartials("(" + args.join(',') + ")=>{" + codes.join('\n') + "\nreturn " + rcode + "}");
}
exports.astToValueFunctionCode = astToValueFunctionCode;
function astToRangeFunctionCode(uniqAST, args, option) {
    var e_10, _a;
    var _b = __read(toProcedure(uniqAST), 2), tempVars = _b[0], returnAST = _b[1];
    var namer = util_1.createNameGenerator();
    var vars = {};
    try {
        for (var args_1 = __values(args), args_1_1 = args_1.next(); !args_1_1.done; args_1_1 = args_1.next()) {
            var arg = args_1_1.value;
            vars[arg] = [arg + 'min', arg + 'max'];
        }
    }
    catch (e_10_1) { e_10 = { error: e_10_1 }; }
    finally {
        try {
            if (args_1_1 && !args_1_1.done && (_a = args_1.return)) _a.call(args_1);
        }
        finally { if (e_10) throw e_10.error; }
    }
    var codes = __spreadArray([], __read(tempVars.entries())).map(function (_a) {
        var _b = __read(_a, 2), name = _b[0], ast = _b[1];
        var _c = __read(ast_1.astToRangeVarNameCode(ast, vars, expander_1.expanders, namer), 2), result = _c[0], code = _c[1];
        if (typeof result === 'number') {
            var varname = namer();
            vars[name] = [varname, varname]; // Must not happen?
            return "const " + varname + "=" + result;
        }
        else {
            vars[name] = result;
            return code;
        }
    });
    var _c = __read(ast_1.astToRangeVarNameCode(returnAST, vars, expander_1.expanders, namer), 2), result = _c[0], rcode = _c[1];
    var argsPart = "(" + args.map(function (a) { return a + "min," + a + "max"; }).join(',') + ")";
    if (typeof result === 'number') {
        var val = isNaN(result) ? util_1.RangeResults.EQNAN : result < -exports.epsilon ? util_1.RangeResults.NEGATIVE : result > exports.epsilon ? util_1.RangeResults.POSITIVE : util_1.RangeResults.EQZERO;
        return argsPart + "=>" + val;
    }
    var fullCode = __spreadArray(__spreadArray([], __read(codes)), [rcode]).join('\n');
    var gapTest = fullCode.includes(expander_1.GAPMARK);
    var nanTest = fullCode.includes(expander_1.NANMARK);
    var gapPrepare = gapTest ? 'let _gap=false;' : '';
    var nanPrepare = nanTest ? 'let _nan=false;' : '';
    var preparePart = gapPrepare + nanPrepare;
    var _d = __read(result, 2), minvar = _d[0], maxvar = _d[1];
    var markEmbeddedCode = fullCode.replaceAll(expander_1.GAPMARK, '_gap=true;').replaceAll(expander_1.NANMARK, '_nan=true;');
    var gapRetPart = gapTest ? "_gap?" + util_1.RangeResults.HASGAP + ":" : '';
    var nanRetPart = nanTest ? "_nan?" + util_1.RangeResults.HASNAN + ":" : '';
    var zeroRetPart = option.zero ? minvar + ">-" + exports.epsilon + "&&" + maxvar + "<" + exports.epsilon + "?" + util_1.RangeResults.EQZERO + ":" : '';
    var zeroRetPartWithNaN = option.zero ? minvar + ">-" + exports.epsilon + "&&" + maxvar + "<" + exports.epsilon + "?" + nanRetPart + util_1.RangeResults.EQZERO + ":" : '';
    var cmpEpsilon = option.eq ? -exports.epsilon : exports.epsilon;
    var returnPart;
    if (option.pos && option.neg) {
        returnPart = "return " + nanRetPart + minvar + ">" + exports.epsilon + "?" + util_1.RangeResults.POSITIVE + ":" + maxvar + "<" + -exports.epsilon + "?" + util_1.RangeResults.NEGATIVE + ":" + zeroRetPart + gapRetPart + util_1.RangeResults.BOTH;
    }
    else if (option.pos) {
        returnPart = "return " + minvar + ">" + cmpEpsilon + "?" + nanRetPart + util_1.RangeResults.POSITIVE + ":" + maxvar + "<" + cmpEpsilon + "?" + util_1.RangeResults.OTHER + ":" + gapRetPart + util_1.RangeResults.BOTH;
    }
    else if (option.neg) {
        returnPart = "return " + maxvar + "<" + -cmpEpsilon + "?" + nanRetPart + util_1.RangeResults.NEGATIVE + ":" + minvar + ">" + -cmpEpsilon + "?" + util_1.RangeResults.OTHER + ":" + gapRetPart + util_1.RangeResults.BOTH;
    }
    else {
        returnPart = "return " + minvar + ">" + exports.epsilon + "||" + maxvar + "<" + -exports.epsilon + "?" + util_1.RangeResults.OTHER + ":" + zeroRetPartWithNaN + gapRetPart + util_1.RangeResults.BOTH;
    }
    return embedRequiredPartials(argsPart + "=>{" + preparePart + markEmbeddedCode + ";" + returnPart + "}");
}
exports.astToRangeFunctionCode = astToRangeFunctionCode;
var defaultPresets = {
    pi: Math.PI,
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
    theta: 'atan2(y,x)'
};
exports.presets3D = {
    r: 'hypot(x,y,z)',
    theta: 'atan2(y,x)',
    phi: 'atan2(hypot(x,y),z)',
};
function duplicates(elements) {
    var e_11, _a;
    var dups = new Set();
    var visited = new Set();
    try {
        for (var elements_1 = __values(elements), elements_1_1 = elements_1.next(); !elements_1_1.done; elements_1_1 = elements_1.next()) {
            var el = elements_1_1.value;
            if (visited.has(el))
                dups.add(el);
            visited.add(el);
        }
    }
    catch (e_11_1) { e_11 = { error: e_11_1 }; }
    finally {
        try {
            if (elements_1_1 && !elements_1_1.done && (_a = elements_1.return)) _a.call(elements_1);
        }
        finally { if (e_11) throw e_11.error; }
    }
    return __spreadArray([], __read(dups));
}
