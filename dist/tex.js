"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.texToPlain = void 0;
function texToPlain(s) {
    return convert(parse(s));
}
exports.texToPlain = texToPlain;
const commandAlias = {
    gt: '>',
    ge: '≥',
    geq: '≥',
    geqq: '≥',
    le: '≤',
    leq: '≤',
    leqq: '≤',
    lt: '<',
    cdot: '・',
    times: '×',
    div: '÷',
};
const greekLetters = [
    'alpha',
    'beta',
    'gamma',
    'delta',
    'epsilon',
    'zeta',
    'eta',
    'theta',
    'iota',
    'kappa',
    'lambda',
    'mu',
    'nu',
    'xi',
    'omicron',
    'pi',
    'rho',
    'sigma',
    'tau',
    'upsilon',
    'phi',
    'chi',
    'psi',
    'omega',
];
greekLetters.forEach((name, i) => {
    const code = 913 + (i < 17 ? i : i + 1);
    const aw = String.fromCharCode(code + 32);
    const AW = String.fromCharCode(code);
    const Name = name[0].toUpperCase() + name.substring(1);
    commandAlias[name] = aw;
    commandAlias[Name] = AW;
});
const functionCommands = new Set([
    'sqrt', 'log', 'exp',
    'sin', 'cos', 'tan',
    'arcsin', 'arccos', 'arctan',
    'sinh', 'cosh', 'tanh',
    'csc', 'sec', 'cot',
    'min', 'max'
]);
function parse(s) {
    var _a;
    let index = 0;
    const chars = [...s];
    let current = { type: 'block', command: false, children: [] };
    const stack = [current];
    function takeCommand() {
        let cmd = '';
        while (index < chars.length && 'a' <= chars[index] && chars[index] <= 'z') {
            cmd += chars[index];
            index++;
        }
        return cmd;
    }
    function open(type, command) {
        const group = { type, command, children: [] };
        current.children.push(group.type === 'block' ? group.children : group);
        stack.push(current = group);
    }
    function close(type, command) {
        const last = stack.pop();
        current = stack[stack.length - 1];
        if (last == null || current == null || last.type !== type || last.command !== command)
            throw 'Parentheses mismatch';
    }
    while (index < chars.length) {
        const c = chars[index++];
        if (c === '{') {
            open('block', true);
        }
        else if (c === '}') {
            close('block', true);
        }
        else if (c === '\\') {
            const cmd = takeCommand();
            if (cmd === 'left' || cmd === 'mleft') {
                const k = chars[index++];
                if (k === '|') {
                    open('abs', true);
                }
                else if (k === '(') {
                    open('paren', true);
                }
                else {
                    throw `Unsupported bracket type "${k}"`;
                }
            }
            else if (cmd === 'right' || cmd === 'mright') {
                const k = chars[index++];
                if (k === '|') {
                    close('abs', true);
                }
                else if (k === ')') {
                    close('paren', true);
                }
                else {
                    throw `Unsupported bracket type "${k}"`;
                }
            }
            else {
                current.children.push((_a = commandAlias[cmd]) !== null && _a !== void 0 ? _a : '\\' + cmd);
            }
        }
        else if (c === '(' || c === ')' || c === '|') {
            if (c === '|') {
                const last = stack[stack.length - 1];
                if (last && last.type === 'abs' && !last.command) {
                    close('abs', false);
                }
                else {
                    open('abs', false);
                }
            }
            else if (c === '(') {
                open('paren', false);
            }
            else if (c === ')') {
                close('paren', false);
            }
        }
        else {
            current.children.push(c);
        }
    }
    if (stack.length !== 1)
        throw 'Too few parentheses';
    return stack[0].children;
}
function convert(block) {
    var _a, _b;
    const elements = [];
    let index = 0;
    while (index < block.length) {
        const node = block[index++];
        if (Array.isArray(node)) {
            elements.push(`(${convert(node)})`);
        }
        else if (typeof node === 'object') {
            let s = convert(node.children);
            if (node.type === 'abs')
                elements.push(`abs(${s})`);
            else
                elements.push(`(${s})`);
        }
        else if (node === '^') {
            const next = block[index];
            elements.push('^');
            if (typeof next === 'string') {
                elements.push(`(${next})`);
                index++;
            }
        }
        else if (node.length >= 2) {
            elements.push(node);
        }
        else {
            if (node !== ' ')
                elements.push(node);
        }
    }
    index = 0;
    const output = [];
    while (index < elements.length) {
        const el = elements[index++];
        if (el[0] !== '\\') {
            output.push(el);
            continue;
        }
        const command = el.substring(1);
        if (command === 'frac') {
            const numerator = elements[index++];
            const denominator = elements[index++];
            if (!numerator || !denominator)
                throw 'Empty "\\frac{}{}"';
            output.push(`((${numerator})/(${denominator}))`);
        }
        else if (command === 'operatorname') {
            const el = elements[index++];
            const name = (_b = (_a = el === null || el === void 0 ? void 0 : el.match(/\((.+)\)/)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : el;
            if (!name)
                throw 'Empty "\\operatorname{}"';
            output.push(' ', name, ' ');
        }
        else if (functionCommands.has(command)) {
            if (command === 'log' && elements[index] === '_') {
                index++;
                const sub = elements[index++];
                if (!sub)
                    throw `Empty subscript after "${command}_"`;
                output.push(' ', command + 'WithSubscript(', sub, ')');
            }
            else {
                output.push(' ', command, ' ');
            }
        }
        else {
            throw `Undefined command "\\${command}"`;
        }
    }
    return output.join('');
}
