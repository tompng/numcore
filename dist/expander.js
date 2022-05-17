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
Object.defineProperty(exports, "__esModule", { value: true });
exports.expanders = exports.assertArgNum = exports.NANMARK = exports.GAPMARK = void 0;
var util_1 = require("./util");
var factorial_1 = require("./factorial");
var EQNAN = util_1.RangeResults.EQNAN;
exports.GAPMARK = '/*GAP*/';
exports.NANMARK = '/*NAN*/';
function raiseArgNumError(name) {
    throw "Wrong number of arguments: " + name;
}
function assertArgNum(name, args, n) {
    if (args.length !== n)
        raiseArgNumError(name);
}
exports.assertArgNum = assertArgNum;
var add = function (_a, namer) {
    var _b = __read(_a, 2), a = _b[0], b = _b[1];
    if (typeof a === 'number' && typeof b === 'number')
        return [a + b, ''];
    var minvar = namer();
    var maxvar = namer();
    var mincode = "const " + minvar + "=" + (typeof a === 'number' ? a : a[0]) + "+" + (typeof b === 'number' ? b : b[0]);
    var maxcode = "const " + maxvar + "=" + (typeof a === 'number' ? a : a[1]) + "+" + (typeof b === 'number' ? b : b[1]);
    return [[minvar, maxvar], mincode + ";" + maxcode];
};
var sub = function (_a, namer) {
    var _b = __read(_a, 2), a = _b[0], b = _b[1];
    if (typeof a === 'number' && typeof b === 'number')
        return [a - b, ''];
    var minvar = namer();
    var maxvar = namer();
    var mincode = "const " + minvar + "=" + (typeof a === 'number' ? a : a[0]) + "-" + (typeof b === 'number' ? b : b[1]);
    var maxcode = "const " + maxvar + "=" + (typeof a === 'number' ? a : a[1]) + "-" + (typeof b === 'number' ? b : b[0]);
    return [[minvar, maxvar], mincode + ";" + maxcode];
};
var minus = function (_a, namer) {
    var _b = __read(_a, 1), a = _b[0];
    if (typeof a === 'number')
        return [-a, ''];
    var _c = __read(a, 2), min = _c[0], max = _c[1];
    var minvar = namer();
    var maxvar = namer();
    return [[minvar, maxvar], "const " + minvar + "=-" + max + "," + maxvar + "=-" + min];
};
function pow2(a, namer) {
    if (typeof a === 'number')
        return [a * a, ''];
    var _a = __read(a, 2), vmin = _a[0], vmax = _a[1];
    var minvar = namer();
    var maxvar = namer();
    var min2 = namer();
    var max2 = namer();
    var prepare = "const " + min2 + "=" + vmin + "*" + vmin + "," + max2 + "=" + vmax + "*" + vmax;
    var mincode = "const " + minvar + "=" + vmin + "<0&&0<" + vmax + "?0:Math.min(" + min2 + "," + max2 + ")";
    var maxcode = "const " + maxvar + "=Math.max(" + min2 + "," + max2 + ")";
    return [[minvar, maxvar], [prepare, mincode, maxcode].join(';')];
}
function powVarUInt(a, b, namer) {
    var minvar = namer();
    var maxvar = namer();
    var _a = __read(a, 2), vmin = _a[0], vmax = _a[1];
    if (b % 2 === 1)
        return [[minvar, maxvar], "const " + minvar + "=" + vmin + "**" + b + "," + maxvar + "=" + vmax + "**" + b];
    var fmin = namer();
    var fmax = namer();
    var prepare = "const " + fmin + "=" + vmin + "**" + b + "," + fmax + "=" + vmax + "**" + b;
    var mincode = "const " + minvar + "=" + vmin + "<0&&0<" + vmax + "?0:Math.min(" + fmin + "," + fmax + ")";
    var maxcode = "const " + maxvar + "=Math.max(" + fmin + "," + fmax + ")";
    return [[minvar, maxvar], [prepare, mincode, maxcode].join(';')];
}
function powVarPositive(_a, b, namer) {
    var _b = __read(_a, 2), vmin = _b[0], vmax = _b[1];
    if (Math.floor(b) === b)
        return powVarUInt([vmin, vmax], b, namer);
    var minvar = namer();
    var maxvar = namer();
    var code = [
        "let " + minvar + "," + maxvar + ";",
        "if(" + vmax + "<0){" + minvar + "=" + maxvar + "=0}",
        "else{" + minvar + "=" + vmin + "<0?0:" + vmin + "**" + b + ";" + maxvar + "=" + vmax + "**" + b + "}"
    ].join('');
    return [[minvar, maxvar], code];
}
var mult = function (_a, namer) {
    var _b = __read(_a, 2), a = _b[0], b = _b[1];
    if (typeof a === 'number' && typeof b === 'number')
        return [a * b, ''];
    if (a === b)
        return pow2(a, namer);
    var minvar = namer();
    var maxvar = namer();
    if (typeof a === 'number' || typeof b === 'number') {
        var n = typeof a === 'number' ? a : b;
        var _c = __read(typeof a !== 'number' ? a : b, 2), minname = _c[0], maxname = _c[1];
        if (n === 0)
            return [0, ''];
        var mincode = "const " + minvar + "=" + (n > 0 ? minname : maxname) + "*" + n;
        var maxcode = "const " + maxvar + "=" + (n > 0 ? maxname : minname) + "*" + n;
        return [[minvar, maxvar], mincode + ";" + maxcode];
    }
    var v1 = namer();
    var v2 = namer();
    var v3 = namer();
    var v4 = namer();
    var _d = __read(a, 2), amin = _d[0], amax = _d[1];
    var _e = __read(b, 2), bmin = _e[0], bmax = _e[1];
    var codes = [
        "const " + v1 + "=" + amin + "*" + bmin + "," + v2 + "=" + amin + "*" + bmax + "," + v3 + "=" + amax + "*" + bmin + "," + v4 + "=" + amax + "*" + bmax,
        "const " + minvar + "=Math.min(" + v1 + "," + v2 + "," + v3 + "," + v4 + ")," + maxvar + "=Math.max(" + v1 + "," + v2 + "," + v3 + "," + v4 + ")"
    ];
    return [[minvar, maxvar], codes.join(';')];
};
function inv(value, namer) {
    if (typeof value === 'number')
        return [1 / value, ''];
    var _a = __read(value, 2), min = _a[0], max = _a[1];
    var minvar = namer();
    var maxvar = namer();
    var codes = [
        "let " + minvar + "," + maxvar + ";",
        "if(" + min + "<=0&&0<=" + max + "){" + exports.GAPMARK + ";" + minvar + "=" + min + "===0&&" + max + "!==0?1/" + max + ":-Infinity;" + maxvar + "=" + min + "!==0&&" + max + "===0?1/" + min + ":Infinity}",
        "else{" + minvar + "=1/" + max + ";" + maxvar + "=1/" + min + "}"
    ];
    return [[minvar, maxvar], codes.join('')];
}
var div = function (_a, namer) {
    var _b = __read(_a, 2), a = _b[0], b = _b[1];
    if (typeof b === 'number')
        return mult([a, 1 / b], namer);
    var _c = __read(inv(b, namer), 2), binv = _c[0], invcode = _c[1];
    var _d = __read(mult([a, binv], namer), 2), result = _d[0], multcode = _d[1];
    return [result, invcode + ";" + multcode];
};
var pow = function (args, namer) {
    assertArgNum('pow', args, 2);
    var _a = __read(args, 2), a = _a[0], b = _a[1];
    if (typeof b === 'number') {
        if (typeof a === 'number')
            return [Math.pow(a, b), ''];
        if (b === 0)
            return [1, ''];
        if (b === 1)
            return [a, ''];
        if (b === 2)
            return pow2(a, namer);
        var _b = __read(powVarPositive(a, Math.abs(b), namer), 2), powabs = _b[0], code_1 = _b[1];
        if (b > 0)
            return [powabs, code_1];
        var _c = __read(inv(powabs, namer), 2), result = _c[0], invcode = _c[1];
        return [result, code_1 + ";" + invcode];
    }
    var minvar = namer();
    var maxvar = namer();
    if (typeof a === 'number') {
        if (a === 0)
            return [0, ''];
        if (a === Math.E)
            return exp([b], namer);
        var _d = __read(b, 2), bmin_1 = _d[0], bmax_1 = _d[1];
        var abs_1 = Math.abs(a);
        if (a < 0) {
            return [
                [minvar, maxvar],
                "const " + minvar + "=0," + maxvar + "=" + -a + "**" + (-1 < a ? bmin_1 : bmax_1)
            ];
        }
        return [
            [minvar, maxvar],
            "const " + minvar + "=" + a + "**" + (a < 1 ? bmax_1 : bmin_1) + "," + maxvar + "=" + abs_1 + "**" + (a < 1 ? bmin_1 : bmax_1)
        ];
    }
    var _e = __read(a, 2), amin = _e[0], amax = _e[1];
    var _f = __read(b, 2), bmin = _f[0], bmax = _f[1];
    var amin2 = namer();
    var v1 = namer();
    var v2 = namer();
    var v3 = namer();
    var v4 = namer();
    var code = [
        "let " + minvar + "," + maxvar + ";",
        "if(" + amax + "<0){return " + EQNAN + "}",
        "else{",
        "if(" + amin + "<0){" + exports.NANMARK + "};",
        "const " + amin2 + "=" + amin + "<0?0:" + amin + ";",
        "const " + v1 + "=" + amin2 + "**" + bmin + "," + v2 + "=" + amin2 + "**" + bmax + "," + v3 + "=" + amax + "**" + bmin + "," + v4 + "=" + amax + "**" + bmax + ";",
        minvar + "=Math.min(" + v1 + "," + v2 + "," + v3 + "," + v4 + ");",
        maxvar + "=Math.max(" + v1 + "," + v2 + "," + v3 + "," + v4 + ")",
        "}"
    ].join('');
    return [[minvar, maxvar], code];
};
function createConvexExpander(func, funcName, type) {
    return function (args, namer) {
        assertArgNum(funcName, args, 1);
        var _a = __read(args, 1), a = _a[0];
        if (typeof a === 'number')
            return [func(a), ''];
        var _b = __read(a, 2), min = _b[0], max = _b[1];
        var minvar = namer();
        var maxvar = namer();
        var fmin = namer();
        var fmax = namer();
        var has0 = min + "<0&&0<" + max + "?" + func(0) + ":";
        var prepare = "const " + fmin + "=Math." + funcName + "(" + min + ")," + fmax + "=Math." + funcName + "(" + max + ")";
        var mincode = "const " + minvar + "=" + (type === 'down' ? has0 : '') + "Math.min(" + fmin + "," + fmax + ")";
        var maxcode = "const " + maxvar + "=" + (type === 'up' ? has0 : '') + "Math.max(" + fmin + "," + fmax + ")";
        return [[minvar, maxvar], [prepare, mincode, maxcode].join(';')];
    };
}
function createMonotonicExpander(func, funcName, type, range) {
    if (range === void 0) { range = {}; }
    var rangeMin = range.min;
    var rangeMax = range.max;
    return function (args, namer) {
        assertArgNum(funcName, args, 1);
        var _a = __read(args, 1), a = _a[0];
        if (typeof a === 'number') {
            var v = rangeMin && a <= rangeMin[0] ? rangeMin[1] : rangeMax && a <= rangeMax[0] ? rangeMax[1] : func(a);
            return [v, ''];
        }
        var _b = __read(a, 2), min = _b[0], max = _b[1];
        var minvar = namer();
        var maxvar = namer();
        var conditions = [];
        if (rangeMin)
            conditions.push("if(" + min + "<" + rangeMin[0] + "){if(" + max + "<=" + rangeMin[0] + ")return " + EQNAN + ";" + exports.NANMARK + "}");
        if (rangeMax)
            conditions.push("if(" + rangeMax[0] + "<" + max + "){if(" + rangeMax[0] + "<=" + min + ")return " + EQNAN + ";" + exports.NANMARK + "}");
        var lcode = rangeMin ? min + "<=" + rangeMin[0] + "?" + rangeMin[1] + ":Math." + funcName + "(" + min + ");" : "Math." + funcName + "(" + min + ")";
        var rcode = rangeMax ? rangeMax[0] + "<=" + max + "?" + rangeMax[1] + ":Math." + funcName + "(" + max + ");" : "Math." + funcName + "(" + max + ")";
        var vcode = minvar + "=" + (type === 'inc' ? lcode : rcode) + ";" + maxvar + "=" + (type === 'inc' ? rcode : lcode);
        var code = __spreadArray(__spreadArray([
            "let " + minvar + "," + maxvar + ";"
        ], __read(conditions)), [
            vcode
        ]).join('');
        return [[minvar, maxvar], code];
    };
}
var exp = createMonotonicExpander(Math.exp, 'exp', 'inc');
var log = createMonotonicExpander(Math.log, 'log', 'inc', { min: [0, -Infinity] });
var sqrt = createMonotonicExpander(Math.sqrt, 'sqrt', 'inc', { min: [0, 0] });
var sinh = createMonotonicExpander(Math.sinh, 'sinh', 'inc');
var cosh = createConvexExpander(Math.cosh, 'cosh', 'down');
var tanh = createMonotonicExpander(Math.tanh, 'tanh', 'inc');
var asin = createMonotonicExpander(Math.asin, 'asin', 'inc', { min: [-1, -Math.PI / 2], max: [1, Math.PI / 2] });
var acos = createMonotonicExpander(Math.acos, 'acos', 'dec', { min: [-1, Math.PI], max: [1, 0] });
var atan = createMonotonicExpander(Math.atan, 'atan', 'inc');
var asinh = createMonotonicExpander(Math.asinh, 'asinh', 'inc');
var acosh = createMonotonicExpander(Math.acosh, 'acosh', 'inc', { min: [1, 0] });
var atanh = createMonotonicExpander(Math.atanh, 'atanh', 'inc', { min: [-1, -Infinity], max: [1, Infinity] });
function sincos(a, mode, namer) {
    var _a = __read(a, 2), min = _a[0], max = _a[1];
    var minvar = namer();
    var maxvar = namer();
    var s1 = namer();
    var s2 = namer();
    var i1 = namer();
    var i2 = namer();
    var offset = mode === 'sin' ? '-0.5' : '';
    var code = [
        "let " + minvar + "," + maxvar + ";",
        "if(" + max + "-" + min + ">" + 2 * Math.PI + "){" + minvar + "=-1;" + maxvar + "=1}",
        "else{",
        "const " + s1 + "=Math." + mode + "(" + min + ")," + s2 + "=Math." + mode + "(" + max + ");",
        "if(" + s1 + "<" + s2 + "){" + minvar + "=" + s1 + ";" + maxvar + "=" + s2 + "}else{" + minvar + "=" + s2 + ";" + maxvar + "=" + s1 + "}",
        "const " + i1 + "=Math.floor(" + min + "*" + 1 / Math.PI + offset + ")," + i2 + "=Math.floor(" + max + "*" + 1 / Math.PI + offset + ");",
        "if(" + i1 + "<(" + i2 + "&-2))" + maxvar + "=1;",
        "if(" + i1 + "<=((" + i2 + "-1)&-2))" + minvar + "=-1",
        "}"
    ].join('');
    return [[minvar, maxvar], code];
}
var sin = function (args, namer) {
    assertArgNum('sin', args, 1);
    var _a = __read(args, 1), a = _a[0];
    if (typeof a === 'number')
        return [Math.sin(a), ''];
    return sincos(a, 'sin', namer);
};
var cos = function (args, namer) {
    assertArgNum('cos', args, 1);
    var _a = __read(args, 1), a = _a[0];
    if (typeof a === 'number')
        return [Math.cos(a), ''];
    return sincos(a, 'cos', namer);
};
var hypot = function (args, namer) {
    if (args.length !== 2 && args.length !== 3)
        raiseArgNumError('hypot');
    var nums = args.filter(function (a) { return typeof a === 'number'; });
    if (nums.length === args.length)
        return [Math.hypot.apply(Math, __spreadArray([], __read(nums))), ''];
    if (args.length === 2) {
        var _a = __read(args, 2), a = _a[0], b = _a[1];
        var _b = __read(pow2(a, namer), 2), avar = _b[0], acode = _b[1];
        var _c = __read(pow2(b, namer), 2), bvar = _c[0], bcode = _c[1];
        var _d = __read(add([avar, bvar], namer), 2), svar = _d[0], scode = _d[1];
        var _e = __read(sqrt([svar], namer), 2), rvar = _e[0], rcode = _e[1];
        return [rvar, [acode, bcode, scode, rcode].join(';')];
    }
    else {
        var _f = __read(args, 3), a = _f[0], b = _f[1], c = _f[2];
        var _g = __read(pow2(a, namer), 2), avar = _g[0], acode = _g[1];
        var _h = __read(pow2(b, namer), 2), bvar = _h[0], bcode = _h[1];
        var _j = __read(pow2(c, namer), 2), cvar = _j[0], ccode = _j[1];
        var _k = __read(add([avar, bvar], namer), 2), s2var = _k[0], s2code = _k[1];
        var _l = __read(add([s2var, cvar], namer), 2), s3var = _l[0], s3code = _l[1];
        var _m = __read(sqrt([s3var], namer), 2), rvar = _m[0], rcode = _m[1];
        return [rvar, [acode, bcode, ccode, s2code, s3code, rcode].join(';')];
    }
};
var atan2 = function (args, namer) {
    assertArgNum('atan2', args, 2);
    var _a = __read(args, 2), y = _a[0], x = _a[1];
    if (typeof y === 'number') {
        if (typeof x === 'number')
            return [Math.atan2(y, x), ''];
        var _b = __read(x, 2), xmin_1 = _b[0], xmax_1 = _b[1];
        var minvar_1 = namer();
        var maxvar_1 = namer();
        var t1 = namer();
        var t2 = namer();
        var code_2 = [
            "const " + t1 + "=Math.atan2(" + y + "," + xmin_1 + ")," + t2 + "=Math.atan2(" + y + "," + xmax_1 + ")",
            "const " + minvar_1 + "=" + t1 + "<" + t2 + "?" + t1 + ":" + t2 + "," + maxvar_1 + "=" + t1 + "<" + t2 + "?" + t2 + ":" + t1
        ].join(';');
        return [[minvar_1, maxvar_1], code_2];
    }
    var _c = __read(y, 2), ymin = _c[0], ymax = _c[1];
    if (typeof x === 'number') {
        var minvar_2 = namer();
        var maxvar_2 = namer();
        var t1 = namer();
        var t2 = namer();
        var assign = minvar_2 + "=" + t1 + "<" + t2 + "?" + t1 + ":" + t2 + ";" + maxvar_2 + "=" + t1 + "<" + t2 + "?" + t2 + ":" + t1;
        var code_3 = [
            "const " + t1 + "=Math.atan2(" + ymin + "," + x + ")," + t2 + "=Math.atan2(" + ymax + "," + x + ")",
            "let " + minvar_2 + "," + maxvar_2,
            x > 0 ? assign : "if(" + ymin + "<0&&" + ymax + ">0){" + exports.GAPMARK + ";" + minvar_2 + "=" + -Math.PI + ";" + maxvar_2 + "=" + Math.PI + "}else{" + assign + "}"
        ].join(';');
        return [[minvar_2, maxvar_2], code_3];
    }
    var _d = __read(x, 2), xmin = _d[0], xmax = _d[1];
    var minvar = namer();
    var maxvar = namer();
    var v1 = namer();
    var v2 = namer();
    var v3 = namer();
    var v4 = namer();
    var code = [
        "let " + minvar + "," + maxvar + ";",
        "if(" + xmin + "<0&&" + ymin + "<=0&&" + ymax + ">=0){" + exports.GAPMARK + ";" + minvar + "=" + -Math.PI + ";" + maxvar + "=" + Math.PI + "}",
        "else{const ",
        v1 + "=Math.atan2(" + ymin + "," + xmin + "),",
        v2 + "=Math.atan2(" + ymin + "," + xmax + "),",
        v3 + "=Math.atan2(" + ymax + "," + xmin + "),",
        v4 + "=Math.atan2(" + ymax + "," + xmax + ");",
        minvar + "=Math.min(" + v1 + "," + v2 + "," + v3 + "," + v4 + ");" + maxvar + "=Math.max(" + v1 + "," + v2 + "," + v3 + "," + v4 + ")",
        "}"
    ].join('');
    return [[minvar, maxvar], code];
};
function numberOrMin(args) {
    return args.map(function (a) { return typeof a === 'number' ? a : a[0]; });
}
function numberOrMax(args) {
    return args.map(function (a) { return typeof a === 'number' ? a : a[1]; });
}
var min = function (args, namer) {
    if (args.length === 0)
        raiseArgNumError('min');
    var minvar = namer();
    var maxvar = namer();
    var mincode = "const " + minvar + "=Math.min(" + numberOrMin(args).join(', ') + ")";
    var maxcode = "const " + maxvar + "=Math.min(" + numberOrMax(args).join(', ') + ")";
    return [[minvar, maxvar], mincode + ';' + maxcode];
};
var max = function (args, namer) {
    if (args.length === 0)
        raiseArgNumError('min');
    var minvar = namer();
    var maxvar = namer();
    var mincode = "const " + minvar + "=Math.max(" + numberOrMin(args).join(', ') + ")";
    var maxcode = "const " + maxvar + "=Math.max(" + numberOrMax(args).join(', ') + ")";
    return [[minvar, maxvar], mincode + ';' + maxcode];
};
var abs = function (args, namer) {
    assertArgNum('abs', args, 1);
    var _a = __read(args, 1), a = _a[0];
    if (typeof a === 'number')
        return [Math.abs(a), ''];
    var _b = __read(a, 2), min = _b[0], max = _b[1];
    var minvar = namer();
    var maxvar = namer();
    var code = [
        "let " + minvar + "," + maxvar + ";",
        "if(0<" + min + "){" + minvar + "=" + min + ";" + maxvar + "=" + max + "}",
        "else if(" + max + "<0){" + minvar + "=-" + max + ";" + maxvar + "=-" + min + "}",
        "else{" + minvar + "=0;" + maxvar + "=Math.max(-" + min + "," + max + ")}"
    ].join('');
    return [[minvar, maxvar], code];
};
function stepFunc(fname, f) {
    return function (args, namer) {
        assertArgNum(fname, args, 1);
        var _a = __read(args, 1), a = _a[0];
        if (typeof a === 'number')
            return [f(a), ''];
        var _b = __read(a, 2), min = _b[0], max = _b[1];
        var minvar = namer();
        var maxvar = namer();
        var code = [
            "const " + minvar + "=Math." + fname + "(" + min + ")," + maxvar + "=Math." + fname + "(" + max + ")",
            "if(" + minvar + "!==" + maxvar + "){" + exports.GAPMARK + "}"
        ].join(';');
        return [[minvar, maxvar], code];
    };
}
var floor = stepFunc('floor', Math.floor);
var ceil = stepFunc('ceil', Math.ceil);
var round = stepFunc('round', Math.round);
var sign = stepFunc('sign', Math.sign);
var atanOverload = function (args, namer) {
    if (args.length === 2)
        return atan2(args, namer);
    return atan(args, namer);
};
var fact = function (args, namer) {
    assertArgNum('factorial', args, 1);
    return factorial_1.expandFactorial(args[0], namer, exports.GAPMARK);
};
exports.expanders = {
    '+': add,
    '-': sub,
    '-@': minus,
    '*': mult,
    '/': div,
    '^': pow,
    sqrt: sqrt,
    exp: exp,
    log: log,
    sin: sin,
    cos: cos,
    sinh: sinh,
    cosh: cosh,
    tanh: tanh,
    asin: asin,
    acos: acos,
    atan: atanOverload,
    asinh: asinh,
    acosh: acosh,
    atanh: atanh,
    hypot: hypot,
    atan2: atan2,
    pow: pow,
    abs: abs,
    min: min,
    max: max,
    floor: floor,
    ceil: ceil,
    round: round,
    sign: sign,
    fact: fact,
};
