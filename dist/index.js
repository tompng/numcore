"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.astToValueFunctionCode = exports.astToRangeFunctionCode = exports.presets3D = exports.presets2D = exports.RangeResults = exports.epsilon = exports.extractVariables = void 0;
var multiline_1 = require("./multiline");
var ast_1 = require("./ast");
Object.defineProperty(exports, "extractVariables", { enumerable: true, get: function () { return ast_1.extractVariables; } });
var multiline_2 = require("./multiline");
Object.defineProperty(exports, "epsilon", { enumerable: true, get: function () { return multiline_2.epsilon; } });
var util_1 = require("./util");
Object.defineProperty(exports, "RangeResults", { enumerable: true, get: function () { return util_1.RangeResults; } });
var multiline_3 = require("./multiline");
Object.defineProperty(exports, "presets2D", { enumerable: true, get: function () { return multiline_3.presets2D; } });
Object.defineProperty(exports, "presets3D", { enumerable: true, get: function () { return multiline_3.presets3D; } });
Object.defineProperty(exports, "astToRangeFunctionCode", { enumerable: true, get: function () { return multiline_3.astToRangeFunctionCode; } });
Object.defineProperty(exports, "astToValueFunctionCode", { enumerable: true, get: function () { return multiline_3.astToValueFunctionCode; } });
function parse(expressionOrExpressions, argNames, presets) {
    if (Array.isArray(expressionOrExpressions)) {
        return multiline_1.parseMultiple(expressionOrExpressions, argNames, presets);
    }
    else {
        return multiline_1.parseMultiple([expressionOrExpressions], argNames, presets)[0];
    }
}
exports.parse = parse;
