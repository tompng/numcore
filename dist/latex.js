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
exports.convertLatex = void 0;
function convertLatex(s) {
    s = s.replaceAll(/\\operatorname\{[a-zA-Z0-9]+\}/g, function (a) { return a.substring(14, a.length - 1); });
    var block = parse1(s);
    return convert(block);
}
exports.convertLatex = convertLatex;
function parse1(s) {
    var index = 0;
    var chars = __spreadArray([], __read(s));
    var root = [];
    var current = root;
    var stack = [root];
    function takeCommand() {
        var cmd = '';
        while (index < chars.length && 'a' <= chars[index] && chars[index] <= 'z') {
            cmd += chars[index];
            index++;
        }
        return cmd;
    }
    while (index < chars.length) {
        var c = chars[index++];
        if (c === '{') {
            var children = [];
            current.push(children);
            stack.push(current = children);
        }
        else if (c === '}') {
            stack.pop();
            current = stack[stack.length - 1];
        }
        else if (c === '\\') {
            var cmd = takeCommand();
            if (cmd === 'left' || cmd === 'mleft') {
                var k = chars[index++];
                var children = [];
                if (k === '|')
                    current.push({ type: 'abs', children: children });
                else
                    current.push({ type: 'paren', children: children });
                stack.push(current = children);
            }
            else if (cmd === 'right' || cmd === 'mright') {
                index++;
                stack.pop();
                current = stack[stack.length - 1];
            }
            else {
                current.push(cmd);
            }
        }
        else {
            current.push(c);
        }
    }
    return root;
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
