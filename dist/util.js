"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniqASTGenerator = exports.createNameGenerator = exports.RangeResults = void 0;
exports.RangeResults = { HASGAP: -3, HASNAN: -2, BOTH: -1, EQZERO: 0, NEGATIVE: 1, POSITIVE: 2, EQNAN: 3, OTHER: 4 };
function createNameGenerator() {
    let nameGeneratorIndex = 0;
    return () => {
        let n = nameGeneratorIndex++;
        const suffix = n % 10;
        n = (n - suffix) / 10;
        let name = '';
        while (name === '' || n > 0) {
            name = String.fromCharCode('a'.charCodeAt(0) + n % 26) + name;
            n = Math.floor(n / 26);
        }
        return name + suffix;
    };
}
exports.createNameGenerator = createNameGenerator;
class UniqASTGenerator {
    constructor() {
        this.key2ast = new Map();
        this.idCnt = 0;
    }
    create(op, args) {
        const uniqKey = this.calcKey(op, args);
        const existing = this.key2ast.get(uniqKey);
        if (existing)
            return existing;
        const uniqId = this.idCnt++;
        const ast = { op, args, uniqId, uniqKey };
        this.key2ast.set(uniqKey, ast);
        return ast;
    }
    convert(ast) {
        if (typeof ast !== 'object')
            return ast;
        return this.create(ast.op, ast.args.map(arg => this.convert(arg)));
    }
    calcKey(op, args) {
        const argIds = args.map(arg => typeof arg === 'object' ? `[${arg.uniqId}]` : String(arg));
        return [op, ...argIds].join('/');
    }
}
exports.UniqASTGenerator = UniqASTGenerator;
