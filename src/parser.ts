import type { ASTNode } from './ast'
import type { CompareMode } from './util'
export const predefinedFunctionNames = new Set([
  'log', 'exp', 'sqrt', 'pow', 'hypot', 'sin', 'cos', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh', 'atan2', '√', 'abs', 'min', 'max',
  'arcsin', 'arccos', 'arctan', 'arctanh', 'arccosh', 'arcsinh',
  'floor', 'ceil', 'round', 'sgn', 'sign', 'signum', 'fact', 'factorial',
])
const comparers = new Set(['<', '=', '>', '<=', '>=', '≤', '≥'])
const comparerAlias: Record<string, string> = { '≤': '<=', '≥': '>=' }
const operators = new Set(['+', '-', '*', '/', '^', '**', '!'])
const alias: Record<string, string | undefined> = {
  '**': '^', '√': 'sqrt',
  'arcsin': 'asin', 'arccos': 'acos', 'arctan': 'atan',
  'arctanh': 'atanh', 'arccosh': 'acosh', 'arcsinh': 'asinh',
  'π': 'pi', 'th': 'theta', 'θ': 'theta', 'φ': 'phi',
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
    if (last.abs !== abs) throw 'Absolute Paren Mismatch'
    if (stack.length === 0) throw 'Paren Mismatch'
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
  if (stack.length !== 1) throw 'Paren Mismatch'
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
      i += 1
    } else if (typeof item === 'string') {
      const result = matchToken(pattern, i, tokens)
      if (!result) throw `Unexpected Token "${pattern[i]}"`
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

// (group|num|arg) !
// (group|num|arg) ^ (group|num|arg)
// func ^ num (group|args)
// func ^ arg group
// func (numargs|group)
// func group !
// func group ^ (group|num|arg)
type ParseStateData = {
  'default': []
  '(group|num|arg)': [ASTNode]
  '(group|num|arg) ^': [ASTNode]
  'func' : [string]
  'func ^' : [string]
  'func ^ (num|arg)' : [string, number | string]
  'func numargs' : [string, ASTNode]
  'func group': [string, ASTNode[]]
  'func group ^': [string, ASTNode[]]
}
type ParseState = { [key in keyof ParseStateData]: [key, ...ParseStateData[key]] }[keyof ParseStateData]
type Args = { type: 'args'; value: ArgGroup }
type Paren = { type: 'paren', value: ASTNode }
type Node = string | number | Args | Paren
type Consumer = { [key in keyof ParseStateData]: (node: Node | null, ...args: ParseStateData[key]) => ParseState }
function assertIndependentNode<T>(node: T, functionNames?: Set<string>): T {
  if (typeof node === 'string') {
    if (node === '!' || node === '^') throw 'Unexpected operator. Wrap with paren.'
    if (functionNames && functionNames.has(node)) throw 'Unexpect function. Wrap with paren.'
  }
  return node
}
function isIndependentNode(node: Node, functionNames?: Set<string>) {
  if (typeof node === 'string') {
    if (node === ' ' || node === '!' || node === '^') return false
    if (functionNames && functionNames.has(node)) return false
  }
  return true
}
function unwrapNode(node: Node, functionNames?: Set<string>): ASTNode {
  if (typeof node === 'object') {
    if (node.type === 'args') throw 'Unexpect function argument'
    return node.value
  }
  return assertIndependentNode(node, functionNames)
}

function buildFuncMultPowBang(group: TokenParenGroup, functionNames: Set<string>): ASTNode {
  const values: Node[] = group.map(g => {
    if (typeof g !== 'object') return g
    const astOrArg = buildAST(g, functionNames)
    return Array.isArray(astOrArg) ? { type: 'args' as const, value: astOrArg } : { type: 'paren' as const, value: astOrArg }
  })
  const mults: ASTNode[] = []
  const consumer: Consumer = {
    'default'(node) {
      if (node == null) return ['default']
      if (node === ' ') return ['default']
      if (typeof node === 'string' && functionNames.has(node)) {
        return ['func', node]
      }
      return ['(group|num|arg)', unwrapNode(node)]
    },
    '(group|num|arg)'(node, value): ParseState {
      if (node == null) {
        mults.push(value)
        return ['default']
      }
      if (node === ' ') return ['(group|num|arg)', value]
      if (node === '^') return ['(group|num|arg) ^', value]
      if (node === '!') {
        mults.push({ op: 'fact', args: [value] })
        return ['default']
      }
      mults.push(value)
      return this.default(node)
    },
    '(group|num|arg) ^'(node, value) {
      if (node == null) throw 'Unexpect end of input after ^'
      if (node === ' ') return ['(group|num|arg) ^', value]
      mults.push({ op: '^', args: [value, unwrapNode(node, functionNames)]})
      return ['default']
    },
    'func'(node, name) {
      if (node == null) throw 'Unexpect end of input after function'
      if (node === ' ') return ['func', name]
      if (node === '^') return ['func ^', name]
      if (typeof node === 'object') {
        return ['func group', name, node.type === 'args' ? node.value : [node.value]]
      } else {
        return ['func numargs', name, assertIndependentNode(node, functionNames)]
      }
    },
    'func numargs'(node, func, numargs) {
      if (node == null) {
        mults.push({ op: func, args: [numargs] })
        return ['default']
      }
      if (typeof node !== 'object' && isIndependentNode(node, functionNames)) {
        return ['func numargs', func, { op: '*', args: [numargs, node] }]
      }
      mults.push({ op: func, args: [numargs] })
      return this.default(node)
    },
    'func ^'(node, func) {
      if (node == null) throw 'Unexpect end of input after ^'
      if (node === ' ') return ['func ^', func]
      if (typeof node === 'object') throw 'Unexpected group in func^group(x). expected func^number_or_group(x)'
      return ['func ^ (num|arg)', func, assertIndependentNode(node)]
    },
    'func ^ (num|arg)'(node, func, numarg) {
      if (node == null) throw 'Unexpect end of input after func^ex. expected arguments'
      if (node === ' ') return ['func ^ (num|arg)', func, numarg]
      if (typeof node !== 'object') throw 'Wrap function args with paren'
      const funcCall = { op: func, args: node.type === 'args' ? node.value : [node.value] }
      mults.push({ op: '^', args: [funcCall, numarg] })
      return ['default']
    },
    'func group'(node, func, args) {
      if (node == null) {
        mults.push({ op: func, args })
        return ['default']
      }
      if (node === ' ') return ['func group', func, args]
      if (node === '^') return ['func group ^', func, args]
      const funcCall = { op: func, args }
      if (node === '!') {
        mults.push({ op: 'fact', args: [funcCall]})
        return ['default']
      } else {
        mults.push(funcCall)
        return this.default(node)
      }
    },
    'func group ^'(node, func, args) {
      if (node == null) throw 'Unexpect end of input after ^'
      if (node === ' ') return ['func group ^', func, args]
      const funcCall = { op: func, args }
      mults.push({ op: '^', args: [funcCall, unwrapNode(node)]})
      return ['default']
    }
  }
  let state: ParseState = ['default']
  for (const node of [...values, null]) {
    const [mode, ...args] = state as [keyof Consumer, ...any[]]
    state = (consumer[mode] as (...args: any[]) => ParseState)(node, ...args)
  }
  return mults.reduce((a, b) => ({ op: '*', args: [a, b] }))
}
function splitByOp(group: TokenParenGroup, index: number, functionNames: Set<string>): ASTNode {
  if (index === oplist.length) return buildFuncMultPowBang(group, functionNames)
  const ops = oplist[index]
  let current: TokenParenGroup = []
  const groups: TokenParenGroup[] = [current]
  const operators: string[] = []
  for (let item of group) {
    if (typeof item === 'string' && ops.has(item)) {
      operators.push(item)
      groups.push(current = [])
    } else {
      current.push(item)
    }
  }
  const first = groups[0]
  let ast = first.length === 0 ? null : splitByOp(first, index + 1, functionNames)
  operators.forEach((op, i) => {
    const left = ast
    const rgroup = groups[i + 1]
    const right = rgroup.length === 0 ? null : splitByOp(rgroup, index + 1, functionNames)
    if (right == null) {
      throw `No Right Hand Side: ${op}`
    } 
    if (left == null) {
      if (op !== '-') throw `No Left Hand Side: ${op}`
      ast = { op: '-@', args: [right] }
    } else {
      ast = { op, args: [left, right] }
    }
  })
  if (ast == null) throw 'Unexpected Empty Group'
  return ast
}
function buildAST(group: TokenParenGroup, functionNames: Set<string>): ASTNode | ArgGroup {
  let current: TokenParenGroup = []
  const out = [current]
  for (let item of group) {
    if (item == ',') out.push(current = [])
    else current.push(item)
  }
  const astNodes = out.map(g => splitByOp(g, 0, functionNames))
  if (astNodes.length === 1) return astNodes[0]
  return astNodes
}
