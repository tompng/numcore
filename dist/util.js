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
exports.UniqASTGenerator = exports.createNameGenerator = exports.RangeResults = void 0;
exports.RangeResults = { HASGAP: -3, HASNAN: -2, BOTH: -1, EQZERO: 0, NEGATIVE: 1, POSITIVE: 2, EQNAN: 3, OTHER: 4 };
function createNameGenerator() {
    var nameGeneratorIndex = 0;
    return function () {
        var n = nameGeneratorIndex++;
        var suffix = n % 10;
        n = (n - suffix) / 10;
        var name = '';
        while (name === '' || n > 0) {
            name = String.fromCharCode('a'.charCodeAt(0) + n % 26) + name;
            n = Math.floor(n / 26);
        }
        return name + suffix;
    };
}
exports.createNameGenerator = createNameGenerator;
var UniqASTGenerator = /** @class */ (function () {
    function UniqASTGenerator() {
        this.key2ast = new Map();
        this.idCnt = 0;
    }
    UniqASTGenerator.prototype.create = function (op, args) {
        var uniqKey = this.calcKey(op, args);
        var existing = this.key2ast.get(uniqKey);
        if (existing)
            return existing;
        var uniqId = this.idCnt++;
        var ast = { op: op, args: args, uniqId: uniqId, uniqKey: uniqKey };
        this.key2ast.set(uniqKey, ast);
        return ast;
    };
    UniqASTGenerator.prototype.convert = function (ast) {
        var _this = this;
        if (typeof ast !== 'object')
            return ast;
        return this.create(ast.op, ast.args.map(function (arg) { return _this.convert(arg); }));
    };
    UniqASTGenerator.prototype.calcKey = function (op, args) {
        var argIds = args.map(function (arg) { return typeof arg === 'object' ? "[" + arg.uniqId + "]" : String(arg); });
        return __spreadArray([op], __read(argIds)).join('/');
    };
    return UniqASTGenerator;
}());
exports.UniqASTGenerator = UniqASTGenerator;
