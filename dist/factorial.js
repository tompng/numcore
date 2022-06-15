"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandFactorial = exports.partials = exports.factorial = exports.factorialCode = void 0;
const fact01 = '1+x*(1-x)*(-0.5772156649010372+x*(0.41184033034933715+x*(-0.49563874123361873+x*(0.4860892114137115+x*(-0.49590343270752174+x*(0.4972165349342847+x*(-0.49853770218375776+x*(0.4980199791231713+x*(-0.4936575170640463+x*(0.47877593441825167+x*(-0.44204174878091285+x*(0.3729736038708739+x*(-0.2736910313924298+x*(0.16545377988367863+x*(-0.07756194073599663+x*(0.026087384946959447+x*(-0.005551499989543484+x*0.0005581849510286821)))))))))))))))))';
const ffact01 = '1+xx*(-0.9999999999996462+xx*(0.6449340668406021+xx*(-0.3550659339220212+xx*(0.18393384190082604+xx*(-0.0931339359708272+xx*(0.04678737306941215+xx*(-0.023564375531682898+xx*(0.012458314523904515+xx*(-0.008149441230122546+xx*(0.0067631566821693325+xx*-0.0038896934274208353))))))))))';
const factPLow = 'x => { let f = 1; while (x > 1) { f *= x;x -= 1; } return fact01(x) * f; }';
const factPHigh = 'x => { let f = 1; while (x < 22) { ++x; f *= x; } return fact22over(x) / f; }';
const factNLow = 'x => { let f = 1; while (x < 0) { ++x; f *= x; } return fact01(x) / f; }';
const factNHigh = 'x => { const n = -Math.floor(x); x += n; return ffact01(x) / x / (1 - x) / fact22over(n - x - 1) * (n % 2 * 2 - 1); }';
const gammacode = `Math.exp(${Math.log(2 * Math.PI) / 2}+(x-0.5)*Math.log(x)-x+(1/12-(1/360-(1/1260-(1/1680-1/1188/x/x)/x/x)/x/x)/x/x)/x)`;
const gammascale = 1124000727777607680000 / eval('const x=23;' + gammacode);
const fact22overCode = `x => { x+=1; return ${gammacode} * ${gammascale}}`;
const factorialMain = `
  x => {
    if (x < 0) {
      if (Math.round(x) === x) return NaN;
      return x < -40 ? factNHigh(x) : factNLow(x);
    } else {
      return x < 13 ? factPLow(x) : factPHigh(x);
    }
  }
`;
exports.factorialCode = `
const fact22over = ${fact22overCode};
const fact01 = x => ${fact01};
const ffact01 = x => { const xx = x * (1 - x); return ${ffact01}; };
const factPLow = ${factPLow};
const factPHigh = ${factPHigh};
const factNLow = ${factNLow};
const factNHigh = ${factNHigh};
const factorial = ${factorialMain};
`;
exports.factorial = eval(`${exports.factorialCode}; factorial`);
const positiveStationaryPoint = 0.46163211383311686;
const negativeStationaryPoints = [-1.5040830437778632, -2.573498483223832, -3.6107208900367693, -4.635293354974648, -5.653237785487496, -6.667162453588306, -7.678418246332976, -8.687788358871952, -9.695764170769765, -10.70267254698388, -11.708740874300776, -12.714133067946872, -13.718971048396153, -14.7233474548453, -15.727334435540822, -16.73098890989209, -17.73435672171477];
const negativeDefaultStationaryPoint = -0.73747516328804;
const factorialRangeThresholdCode = `const factorialStationaries = [${negativeStationaryPoints.join(',')}];`;
exports.partials = {
    factorial: exports.factorialCode,
    factorialRangeThreshold: factorialRangeThresholdCode,
};
function expandFactorial(x, namer, GAPMARK) {
    if (typeof x === 'number')
        return [exports.factorial(x), ''];
    const [xmin, xmax] = x;
    const minvar = namer();
    const maxvar = namer();
    const thresholdvar = namer();
    const temp1 = namer();
    const temp2 = namer();
    const code = `
    /*REQUIRE(factorial factorialRangeThreshold)*/
    let ${minvar}, ${maxvar};
    if(-1 < ${xmin}){
      if (${xmin} < ${positiveStationaryPoint}) {
        if (${positiveStationaryPoint} < ${xmax}) {
          ${maxvar} = Math.max(factorial(${xmin}), factorial(${xmax}));
          ${minvar} = ${exports.factorial(positiveStationaryPoint)};
        } else {
          ${minvar} = factorial(${xmax});
          ${maxvar} = factorial(${xmin});
        }
      } else {
        ${minvar} = factorial(${xmin});
        ${maxvar} = factorial(${xmax});
      }
    } else if (Math.floor(${xmin}) !== Math.floor(${xmax})) {
      ${GAPMARK}; ${minvar} = -Infinity; ${maxvar} = Infinity;
    } else {
      const ${thresholdvar} = -${xmin}<${negativeStationaryPoints.length + 1} ? factorialStationaries[Math.floor(-${xmin}-1)] : ${negativeDefaultStationaryPoint};
      if (${xmin} < ${thresholdvar} && ${thresholdvar} < ${xmax}) {
        if (${xmin} % 2 < -1) {
          ${maxvar} = factorial(${thresholdvar});
          ${minvar} = Math.min(factorial(${xmin}), factorial(${xmax}));
        } else {
          ${minvar} = factorial(${thresholdvar});
          ${maxvar} = Math.max(factorial(${xmin}), factorial(${xmax}));
        }
      } else {
        const ${temp1} = factorial(${xmin}), ${temp2} = factorial(${xmax});
        ${minvar} = Math.min(${temp1}, ${temp2}); ${maxvar} = Math.max(${temp1}, ${temp2});
      }
    }
  `;
    return [[minvar, maxvar], code];
}
exports.expandFactorial = expandFactorial;
