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
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandFactorial = exports.partials = exports.factorial = exports.factorialCode = void 0;
var fact01 = '1+x*(1-x)*(-0.5772156649010372+x*(0.41184033034933715+x*(-0.49563874123361873+x*(0.4860892114137115+x*(-0.49590343270752174+x*(0.4972165349342847+x*(-0.49853770218375776+x*(0.4980199791231713+x*(-0.4936575170640463+x*(0.47877593441825167+x*(-0.44204174878091285+x*(0.3729736038708739+x*(-0.2736910313924298+x*(0.16545377988367863+x*(-0.07756194073599663+x*(0.026087384946959447+x*(-0.005551499989543484+x*0.0005581849510286821)))))))))))))))))';
var ffact01 = '1+xx*(-0.9999999999996462+xx*(0.6449340668406021+xx*(-0.3550659339220212+xx*(0.18393384190082604+xx*(-0.0931339359708272+xx*(0.04678737306941215+xx*(-0.023564375531682898+xx*(0.012458314523904515+xx*(-0.008149441230122546+xx*(0.0067631566821693325+xx*-0.0038896934274208353))))))))))';
var factPLow = 'x => { let f = 1; while (x > 1) { f *= x;x -= 1; } return fact01(x) * f; }';
var factPHigh = 'x => { let f = 1; while (x < 22) { ++x; f *= x; } return fact22over(x) / f; }';
var factNLow = 'x => { let f = 1; while (x < 0) { ++x; f *= x; } return fact01(x) / f; }';
var factNHigh = 'x => { const n = -Math.floor(x); x += n; return ffact01(x) / x / (1 - x) / fact22over(n - x - 1) * (n % 2 * 2 - 1); }';
var gammacode = "Math.exp(" + Math.log(2 * Math.PI) / 2 + "+(x-0.5)*Math.log(x)-x+(1/12-(1/360-(1/1260-(1/1680-1/1188/x/x)/x/x)/x/x)/x/x)/x)";
var gammascale = 1124000727777607680000 / eval('const x=23;' + gammacode);
var fact22overCode = "x => { x+=1; return " + gammacode + " * " + gammascale + "}";
var factorialMain = "\n  x => {\n    if (x <= -1) {\n      if (Math.round(x) === x) return NaN;\n      return x < -40 ? factNHigh(x) : factNLow(x);\n    } else {\n      return x < 13 ? factPLow(x) : factPHigh(x);\n    }\n  }\n";
exports.factorialCode = "\nconst fact22over = " + fact22overCode + ";\nconst fact01 = x => " + fact01 + ";\nconst ffact01 = x => { const xx = x * (1 - x); return " + ffact01 + "; };\nconst factPLow = " + factPLow + ";\nconst factPHigh = " + factPHigh + ";\nconst factNLow = " + factNLow + ";\nconst factNHigh = " + factNHigh + ";\nconst factorial = " + factorialMain + ";\n";
exports.factorial = eval(exports.factorialCode + "; factorial");
var positiveStationaryPoint = 0.46163211383311686;
var negativeStationaryPoints = [-1.5040830437778632, -2.573498483223832, -3.6107208900367693, -4.635293354974648, -5.653237785487496, -6.667162453588306, -7.678418246332976, -8.687788358871952, -9.695764170769765, -10.70267254698388, -11.708740874300776, -12.714133067946872, -13.718971048396153, -14.7233474548453, -15.727334435540822, -16.73098890989209, -17.73435672171477];
var negativeDefaultStationaryPoint = -0.73747516328804;
var factorialRangeThresholdCode = "const factorialStationaries = [" + negativeStationaryPoints.join(',') + "];";
exports.partials = {
    factorial: exports.factorialCode,
    factorialRangeThreshold: factorialRangeThresholdCode,
};
function expandFactorial(x, namer, GAPMARK) {
    if (typeof x === 'number')
        return [exports.factorial(x), ''];
    var _a = __read(x, 2), xmin = _a[0], xmax = _a[1];
    var minvar = namer();
    var maxvar = namer();
    var thresholdvar = namer();
    var temp1 = namer();
    var temp2 = namer();
    var code = "\n    /*REQUIRE(factorial factorialRangeThreshold)*/\n    let " + minvar + ", " + maxvar + ";\n    if(-1 < " + xmin + "){\n      if (" + xmin + " < " + positiveStationaryPoint + ") {\n        if (" + positiveStationaryPoint + " < " + xmax + ") {\n          " + maxvar + " = Math.max(factorial(" + xmin + "), factorial(" + xmax + "));\n          " + minvar + " = " + exports.factorial(positiveStationaryPoint) + ";\n        } else {\n          " + minvar + " = factorial(" + xmax + ");\n          " + maxvar + " = factorial(" + xmin + ");\n        }\n      } else {\n        " + minvar + " = factorial(" + xmin + ");\n        " + maxvar + " = factorial(" + xmax + ");\n      }\n    } else if (Math.floor(" + xmin + ") !== Math.floor(" + xmax + ")) {\n      " + GAPMARK + "; " + minvar + " = -Infinity; " + maxvar + " = Infinity;\n    } else {\n      const " + thresholdvar + " = -" + xmin + "<" + (negativeStationaryPoints.length + 1) + " ? factorialStationaries[Math.floor(-" + xmin + "-1)] : " + negativeDefaultStationaryPoint + ";\n      if (" + xmin + " < " + thresholdvar + " && " + thresholdvar + " < " + xmax + ") {\n        if (" + xmin + " % 2 < -1) {\n          " + maxvar + " = factorial(" + thresholdvar + ");\n          " + minvar + " = Math.min(factorial(" + xmin + "), factorial(" + xmax + "));\n        } else {\n          " + minvar + " = factorial(" + thresholdvar + ");\n          " + maxvar + " = Math.max(factorial(" + xmin + "), factorial(" + xmax + "));\n        }\n      } else {\n        const " + temp1 + " = factorial(" + xmin + "), " + temp2 + " = factorial(" + xmax + ");\n        " + minvar + " = Math.min(" + temp1 + ", " + temp2 + "); " + maxvar + " = Math.max(" + temp1 + ", " + temp2 + ");\n      }\n    }\n  ";
    return [[minvar, maxvar], code];
}
exports.expandFactorial = expandFactorial;
