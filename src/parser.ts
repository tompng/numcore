import type { ASTNode } from './ast'
import type { CompareMode } from './util'
export const predefinedFunctionNames = new Set([
  'log', 'exp', 'sqrt', 'pow', 'hypot', 'sin', 'cos', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh', 'atan2', '√', 'abs', 'min', 'max',
  'arcsin', 'arccos', 'arctan', 'arctanh', 'arccosh', 'arcsinh',
  'floor', 'ceil', 'round', 'sgn', 'sign', 'signum', 'fact', 'factorial',
])
const comparers = new Set(['<', '=', '>', '<=', '>=', '≤', '≥'])
const comparerAlias: Record<string, string> = { '≤': '<=', '≥': '>=' }
const operators = new Set(['+', '-', '*', '/', '^', '**', '!', '・', '×', '÷'])
const alias: Record<string, string | undefined> = {
  '・': '*', '×': '*', '÷': '/', '**': '^', '√': 'sqrt',
  'arcsin': 'asin', 'arccos': 'acos', 'arctan': 'atan',
  'arctanh': 'atanh', 'arccosh': 'acosh', 'arcsinh': 'asinh',
  'sgn': 'sign', 'signum': 'sign', 'factorial': 'fact',
}
const tokenSet = new Set([...predefinedFunctionNames, ...Object.keys(alias), ...operators, ...comparers, ',', ' '])

type ParenGroup = (string | ParenGroup)[]
function parseParen(input: string): ParenGroup {
  const stack: { abs: boolean; group: ParenGroup }[] = [{ abs: false, group: [] }]
  let current = stack[stack.length - 1]
  const push = (abs: boolean) => {
    const group: ParenGroup[] = []
    current.group.push(group)
    stack.push(current = { abs, group })
  }
  const pop = (abs: boolean) => {
    const last = stack.pop()!
    if (last.abs !== abs) throw 'Absolute value brackets mismatch'
    if (stack.length === 0) throw 'Parentheses mismatch'
    current = stack[stack.length - 1]
  }
  for (const c of input) {
    if (c === '(') {
      push(false)
    } else if (c === ')') {
      pop(false)
    } else if (c === '|') {
      if (stack[stack.length - 1].abs) {
        pop(true)
      } else {
        current.group.push('a', 'b', 's')
        push(true)
      }
    } else {
      current.group.push(c)
    }
  }
  if (stack.length !== 1) throw 'Parentheses mismatch'
  return current.group
}

function convertAlias(s: string) {
  return alias[s] || s
}

type Tokens = { set: Set<string>; max: number }

function matchToken(s: string, i: number, tokens: Tokens): [number | string, number] | null{
  if (s[i].match(/\d/)) {
    let len = 1
    let dotCount = 0
    while (i + len < s.length && (s[i + len].match(/\d/) || (dotCount === 0 && s[i + len] === '.'))) {
      if (s[i + len] === '.') dotCount++
      len++
    }
    return [parseFloat(s.substr(i, len)), len]
  }
  for (let len = tokens.max; len >= 1; len-=1) {
    if (tokens.set.has(s.substr(i, len))) return [convertAlias(s.substr(i, len)), len]
  }
  return null
}

type TokenParenGroup = (string | number | TokenParenGroup)[]
function tokenize(group: ParenGroup, tokens: Tokens): TokenParenGroup {
  const out: TokenParenGroup = []
  const pattern = group.map(s => typeof s === 'string' ? s : '@').join('')
  for (let i = 0; i < group.length;) {
    const item = group[i]
    if (item === ' ') {
      if (out[out.length - 1] !== item) out.push(item)
      i ++
    } else if (typeof item === 'string') {
      const result = matchToken(pattern, i, tokens)
      if (!result) {
        const s = pattern[i]
        if (s.match(/[a-zA-Zα-ωΑ-Ω]+/)) {
          throw `Undefined variable or function name "${s}"`
        } else {
          throw `Unexpected token "${s}"`
        }
      }
      const [v, len] = result
      out.push(v)
      i += len
    } else {
      out.push(tokenize(item, tokens))
      i ++
    }
  }
  return out
}

export function parse(s: string, extraVariables?: Set<string>, extraFunctions?: Set<string>) {
  const pg = parseParen(s.replace(/\s/g, ' '))
  const tokens = { set: new Set(tokenSet), max: 0 }
  const functions = new Set(predefinedFunctionNames)
  if (extraVariables) extraVariables.forEach(t => tokens.set.add(t))
  if (extraFunctions) extraFunctions.forEach(t => {
    tokens.set.add(t)
    functions.add(t)
  })
  for (const t of tokens.set) {
    if (tokens.max < t.length) tokens.max = t.length
  }
  const tg = tokenize(pg, tokens)
  return buildRootAST(tg, functions)
}

function flipComparator(cmp: CompareMode): CompareMode {
  switch (cmp) {
    case '>': return '<'
    case '>=': return '<='
    case '<': return '>'
    case '<=': return '>='
    default: return cmp
  }
}

function buildRootAST(group: TokenParenGroup, functionNames: Set<string>): [ASTNode, CompareMode] {
  const idx = group.findIndex(item => typeof item === 'string' && comparers.has(item))
  if (idx === -1) {
    const ast = buildAST(group, functionNames)
    if (Array.isArray(ast)) throw 'Unexpected comma'
    return [ast, null]
  }
  const cmp = group[idx] as string
  const compareMode = (comparerAlias[cmp] ?? cmp) as CompareMode
  const left = buildAST(group.slice(0, idx), functionNames)
  const right = buildAST(group.slice(idx + 1), functionNames)
  if (Array.isArray(left) || Array.isArray(right)) throw 'Unexpected comma'
  if (left === 0) {
    return [right, flipComparator(compareMode)]
  } else if (right === 0) {
    return [left, compareMode]
  } else {
    return [{ op: '-', args: [left, right] }, compareMode]
  }
}
type ArgGroup = ASTNode[]
const oplist = [new Set(['+', '-']), new Set(['*', '/'])]

// numvars !
// numvars ^ (group|num|var)
// group !
// group ^ (group|num|var)
// func ^ (group|num|var) (group|args)
// func numvars
// func (group|args) !
// func (group|args) ^ (group|num|var)

type ParseStateData = {
  'default': []
  'numvars': [ASTNode[]]
  'numvars ': [ASTNode[]]
  'numvars ^': [ASTNode[]]
  'group': [ASTNode]
  'group ^': [ASTNode]
  'subfunc': [string]
  'func' : [string, ASTNode[]]
  'func ^' : [string, ASTNode[]]
  'func ^ ex' : [string, ASTNode[], ASTNode]
  'func numvars' : [string, ASTNode[], ASTNode]
  'func args': [string, ASTNode[]]
  'func args ^': [string, ASTNode[]]
}
type ParseState = { [key in keyof ParseStateData]: [key, ...ParseStateData[key]] }[keyof ParseStateData]
type Args = { type: 'args'; value: ArgGroup }
type Paren = { type: 'paren', value: ASTNode }
type Node = string | number | Args | Paren
type Consumer = { [key in keyof ParseStateData]: (node: Node | null, ...args: ParseStateData[key]) => ParseState }
function assertIndependentNode<T>(node: T, functionNames?: Set<string>): T {
  if (typeof node === 'string') {
    if (node === '!' || node === '^') throw 'Unexpected operator. Wrap with parentheses.'
    if (functionNames && functionNames.has(node)) throw 'Unexpected function. Wrap with parentheses.'
  }
  return node
}

const inverseExistingFunctions = new Set(['sin', 'cos', 'tan', 'sinh', 'cosh', 'tanh'])

function isIndependentNode(node: Node, functionNames?: Set<string>) {
  if (typeof node === 'string') {
    if (node === ' ' || node === '!' || node === '^') return false
    if (functionNames && functionNames.has(node)) return false
  }
  return true
}
function unwrapNode(node: Node, functionNames: Set<string>): ASTNode {
  if (typeof node === 'object') {
    if (node.type === 'args') throw 'Unexpected function argument'
    return node.value
  }
  return assertIndependentNode(node, functionNames)
}

function buildFuncMultPowBang(group: TokenParenGroup, functionNames: Set<string>): ASTNode[] {
  const values: Node[] = group.map(g => {
    if (typeof g !== 'object') return g
    const astOrArg = buildAST(g, functionNames)
    return Array.isArray(astOrArg) ? { type: 'args' as const, value: astOrArg } : { type: 'paren' as const, value: astOrArg }
  })
  function mult(nodes: ASTNode[]): ASTNode { return nodes.reduce((a, b) => ({ op: '*', args: [a, b] })) }
  function splitLast<T>(item: T[]) {
    return [item.slice(0, item.length - 1), item[item.length - 1]] as const
  }
  function isFunction(node: Node) {
    return typeof node === 'string' && functionNames.has(node)
  }
  const multGroups: ASTNode[] = []
  const consumer: Consumer = {
    'default'(node) {
      if (node == null) return ['default']
      if (node === ' ') return ['default']
      if (typeof node === 'string' && isFunction(node)) {
        if (node.match(/WithSubscript$/)) return ['subfunc', node]
        return ['func', node, []]
      }
      if (typeof node === 'object') {
        return ['group', unwrapNode(node, functionNames)]
      }
      return ['numvars', [unwrapNode(node, functionNames)]]
    },
    'numvars'(node, value) {
      if (node == null || isFunction(node) || typeof node === 'object') {
        multGroups.push(mult(value))
        return this.default(node)
      }
      if (node === ' ') return ['numvars ', value]
      if (node === '^') return ['numvars ^', value]
      if (node === '!') {
        const [other, last] = splitLast(value)
        multGroups.push(mult([...other, { op: 'fact', args: [last] }]))
        return ['default']
      }
      return ['numvars', [...value, unwrapNode(node, functionNames)]]
    },
    'numvars '(node, value) {
      if (node === ' ' || node === '^' || node === '!') return this['numvars'](node, value)
      this['numvars'](null, value)
      return this.default(node)
    },
    'group'(node, value) {
      if (node == null) {
        multGroups.push(value)
        return ['default']
      }
      if (node === ' ') return ['group', value]
      if (node === '^') return ['group ^', value]
      if (node === '!') {
        multGroups.push({ op: 'fact', args: [value] })
        return ['default']
      }
      multGroups.push(value)
      return this.default(node)
    },
    'numvars ^'(node, value) {
      if (node == null) throw 'Unexpected end of input after ^'
      if (node === ' ') return ['numvars ^', value]
      const [other, last] = splitLast(value)
      multGroups.push(mult([...other, { op: '^', args: [last, unwrapNode(node, functionNames)] }]))
      return ['default']
    },
    'group ^'(node, value) {
      if (node == null) throw 'Unexpected end of input after ^'
      if (node === ' ') return ['group ^', value]
      multGroups.push({ op: '^', args: [value, unwrapNode(node, functionNames)]})
      return ['default']
    },
    'subfunc'(node, name) {
      if (node === ' ') return ['subfunc', name]
      if (node === '^') throw `Unexpected "^" in subscript of "${name}"`
      if (node == null) throw `Unexpected end of input after subscript of "${name}"`
      if (typeof node === 'object') {
        if (node.type === 'args') throw `Unexpected comma in subscript of "${name}"`
        return ['func', name, [node.value]]
      } else {
        return ['func', name, [node]]
      }
    },
    'func'(node, name, decorators) {
      if (node == null) throw 'Unexpected end of input after function'
      if (node === ' ') return ['func', name, decorators]
      if (node === '^') return ['func ^', name, decorators]
      if (typeof node === 'object') {
        return ['func args', name, node.type === 'args' ? [...decorators, ...node.value] : [...decorators, node.value]]
      } else {
        return ['func numvars', name, decorators, assertIndependentNode(node, functionNames)]
      }
    },
    'func numvars'(node, func, decorators, numvars) {
      if (node == null) {
        multGroups.push({ op: func, args: [...decorators, numvars] })
        return ['default']
      }
      if (typeof node !== 'object' && isIndependentNode(node, functionNames)) {
        return ['func numvars', func, decorators, { op: '*', args: [numvars, node] }]
      }
      multGroups.push({ op: func, args: [...decorators, numvars] })
      return this.default(node)
    },
    'func ^'(node, func, decorators) {
      if (node == null) throw 'Unexpected end of input after ^'
      if (node === ' ') return ['func ^', func, decorators]
      const ex = unwrapNode(node, functionNames)
      if (inverseExistingFunctions.has(func) && (ex === -1 || (typeof ex === 'object' && ex.op === '-@' && ex.args[0] === 1))) {
        throw `Ambiguous func^(-1)(x). Use 1/${func}(x), ${func}(x)^(-1) or arc${func}(x)`
      }
      return ['func ^ ex', func, decorators, ex]
    },
    'func ^ ex'(node, func, decorators, ex) {
      if (node == null) throw 'Unexpected end of input after func^ex. expected arguments'
      if (node === ' ') return ['func ^ ex', func, decorators, ex]
      if (typeof node !== 'object') throw 'Wrap function arguments with parentheses'
      const funcCall = { op: func, args: node.type === 'args' ? [...decorators, ...node.value] : [...decorators, node.value] }
      multGroups.push({ op: '^', args: [funcCall, ex] })
      return ['default']
    },
    'func args'(node, func, args) {
      if (node == null) {
        multGroups.push({ op: func, args })
        return ['default']
      }
      if (node === ' ') return ['func args', func, args]
      if (node === '^') return ['func args ^', func, args]
      const funcCall = { op: func, args }
      if (node === '!') {
        multGroups.push({ op: 'fact', args: [funcCall]})
        return ['default']
      } else {
        multGroups.push(funcCall)
        return this.default(node)
      }
    },
    'func args ^'(node, func, args) {
      if (node == null) throw 'Unexpected end of input after ^'
      if (node === ' ') return ['func args ^', func, args]
      const funcCall = { op: func, args }
      multGroups.push({ op: '^', args: [funcCall, unwrapNode(node, functionNames)]})
      return ['default']
    }
  }
  let state: ParseState = ['default']
  for (const node of [...values, null]) {
    const [mode, ...args] = state as [keyof Consumer, ...any[]]
    state = (consumer[mode] as (...args: any[]) => ParseState)(node, ...args)
  }
  return multGroups
}

function splitByOp<T extends string>(items: TokenParenGroup, op: T[]) {
  const output: [T | null, TokenParenGroup][] = []
  for (const item of items) {
    if ((op as any[]).includes(item)) {
      output.push([item as T, []])
    } else {
      if (output.length === 0) output.push([null, []])
      output[output.length - 1][1].push(item)
    }
  }
  return output
}

function splitMultDiv(group: TokenParenGroup, functionNames: Set<string>): ASTNode {
  const result = splitByOp(group, ['*', '/']).reduce((ast, [op, group]) => {
    if (group.length === 0) throw `No right hand side: ${op}`
    if (ast == null && op != null) throw `No left hand side: ${op}`
    const nodes = buildFuncMultPowBang(group, functionNames)
    if (op === '/') ast = { op: '/', args: [ast!, nodes.shift()!] }
    const rhs = nodes.length ? nodes.reduce((a, b) => ({ op: '*', args: [a, b] })) : null
    if (ast != null && rhs != null) return { op: '*', args: [ast, rhs] }
    return ast ?? rhs
  }, null as null | ASTNode)
  if (result == null) throw 'Unexpected empty group'
  return result
}
function splitPlusMinus(group: TokenParenGroup, functionNames: Set<string>): ASTNode {
  const result = splitByOp(group, ['+', '-']).reduce((ast, [op, group]) => {
    if (group.length === 0) throw `No right hand side: ${op}`
    const rhs = splitMultDiv(group, functionNames)
    if (ast === null) return op === '-' ? { op: '-@', args: [rhs] } : rhs
    return { op: op === '-' ? '-' : '+', args: [ast, rhs] }
  }, null as null | ASTNode)
  if (result == null) throw 'Unexpected empty group'
  return result
}

function buildAST(group: TokenParenGroup, functionNames: Set<string>): ASTNode | ArgGroup {
  let current: TokenParenGroup = []
  const out = [current]
  for (let item of group) {
    if (item == ',') out.push(current = [])
    else current.push(item)
  }
  const astNodes = out.map(g => splitPlusMinus(g, functionNames))
  if (astNodes.length === 1) return astNodes[0]
  return astNodes
}
