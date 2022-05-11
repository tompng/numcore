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
exports.texToPlain = void 0;
function texToPlain(s) {
    s = s.replaceAll(/\\operatorname\{[a-zA-Z0-9]+\}/g, function (a) { return a.substring(14, a.length - 1); });
    var block = parse(s);
    return convert(block);
}
exports.texToPlain = texToPlain;
var commandAlias = {
    'gt': '>',
    'ge': '≥',
    'le': '≤',
    'lt': '<'
};
function parse(s) {
    var _a;
    var index = 0;
    var chars = __spreadArray([], __read(s));
    var current = { type: 'block', command: false, children: [] };
    var stack = [current];
    function takeCommand() {
        var cmd = '';
        while (index < chars.length && 'a' <= chars[index] && chars[index] <= 'z') {
            cmd += chars[index];
            index++;
        }
        return cmd;
    }
    function open(type, command) {
        var group = { type: type, command: command, children: [] };
        current.children.push(group.type === 'block' ? group.children : group);
        stack.push(current = group);
    }
    function close(type, command) {
        var last = stack.pop();
        current = stack[stack.length - 1];
        if (last == null || current == null || last.type !== type || last.command !== command)
            throw 'Paren mismatch';
    }
    while (index < chars.length) {
        var c = chars[index++];
        if (c === '{') {
            open('block', true);
        }
        else if (c === '}') {
            close('block', true);
        }
        else if (c === '\\') {
            var cmd = takeCommand();
            if (cmd === 'left' || cmd === 'mleft') {
                var k = chars[index++];
                if (k === '|') {
                    open('abs', true);
                }
                else if (k === '(') {
                    open('paren', true);
                }
                else {
                    throw "Unsupported paren \"" + k + "\"";
                }
            }
            else if (cmd === 'right' || cmd === 'mright') {
                var k = chars[index++];
                if (k === '|') {
                    close('abs', true);
                }
                else if (k === ')') {
                    close('paren', true);
                }
                else {
                    throw "Unsupported paren \"" + k + "\"";
                }
            }
            else {
                current.children.push((_a = commandAlias[cmd]) !== null && _a !== void 0 ? _a : cmd);
            }
        }
        else if (c === '(' || c === ')' || c === '|') {
            if (c === '|') {
                var last = stack[stack.length - 1];
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
        throw 'Too few paren';
    return stack[0].children;
}
function convert(block) {
    var elements = [];
    var index = 0;
    while (index < block.length) {
        var node = block[index++];
        if (Array.isArray(node)) {
            elements.push("(" + convert(node) + ")");
        }
        else if (typeof node === 'object') {
            var s = convert(node.children);
            if (node.type === 'abs')
                elements.push("abs(" + s + ")");
            else
                elements.push("(" + s + ")");
        }
        else if (node === '^') {
            var next = block[index];
            elements.push('^');
            if (typeof next === 'string') {
                elements.push("(" + next + ")");
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
    var output = [];
    while (index < elements.length) {
        var s = elements[index++];
        if (s === 'frac') {
            output.push("((" + elements[index++] + ")/(" + elements[index++] + "))");
        }
        else {
            output.push(s);
        }
    }
    return output.join('');
}
