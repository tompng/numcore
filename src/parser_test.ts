import { parse } from './parser'
const console = eval('global').console

console.log(JSON.stringify(parse('x+y+z', new Set(['x','y','z']))))


const examples: [string, string][] = [
  [
    '- a+b+c + d -e',
    '((((-a)+b)+c)+d)-e'
  ],
  [
    '2ab3c',
    '(((2*a)*b)*3)*c'
  ],
  [
    'a*b*c*d',
    '((a*b)*c)*d'
  ],
  [
    '2a(1+b)cd e3f*gh',
    '(2*a*(1+b)*c*d*e*3*f)*(g*h)'
  ],
  [
    'sinxsiny',
    '(sin(x))*(sin(y))'
  ],
  [
    'ab^2c3d',
    'a*(b^2)*c*3*d'
  ],
  [
    'xysin2xcdsin5y',
    'x*y*sin(2xcd)*sin(5y)'
  ],
  [
    'ab!c!de12!sin(x)!(a+b)(c+d)!e ! exp (x) !',
    'a*(b!)*(c!)*d*e*(12!)*((sin(x))!)*(a+b)*((c+d)!)*(e!)*((exp(x))!)'
  ],
  [
    'sinab c^d(e+f)^(g+h)sin(ij)^k',
    'sin(ab)*(c^d)*((e+f)^(g+h))*((sin(ij))^k)'
  ],
]

function red(s: string) { return `\x1B[31m${s}\x1B[m`}
function green(s: string) { return `\x1B[32m${s}\x1B[m`}
for (const [a, b] of examples) {
  const args = new Set([...'abcdefghijklmnopqrstuvwxyz'])
  let pa: ReturnType<typeof parse> | { error: any }
  let pb: ReturnType<typeof parse> | { error: any }
  try { pa = parse(a, args) } catch (error) { pa = { error }}
  try { pb = parse(b, args) } catch (error) { pb = { error }}
  if ('error' in pa || JSON.stringify(pa) !== JSON.stringify(pb)) {
    console.log(`${red('ERROR')} ${JSON.stringify(a)} != ${JSON.stringify(b)}`)
    console.log(JSON.stringify(pa))
    console.log(JSON.stringify(pb))
  } else {
    console.log(green('OK') + ' ' + a)
  }
}
