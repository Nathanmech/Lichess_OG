import { Tree } from '../shared/tree'

const files = 'abcdefgh'
const promotions = 'qrbnk'
const charShift = 35

function squareChar(square: string): string {
  return String.fromCharCode(charShift + files.indexOf(square[0]) + 8 * (parseInt(square[1]) - 1))
}

// same node id as the one lichess.org and the chess worker give to a move
export function uciToNodeId(uci: string): string {
  const orig = squareChar(uci.slice(0, 2))
  const dest = uci.length > 4 ?
    String.fromCharCode(charShift + 64 + 8 * promotions.indexOf(uci[4]) + files.indexOf(uci[2])) :
    squareChar(uci.slice(2, 4))
  return orig + dest
}

// lichess.org sends the puzzle solution without node ids and without the
// (empty) children of the last move: the tree code needs both
export function normalizeBranch(node: Tree.Node): Tree.Node {
  const n = node as { -readonly [K in keyof Tree.Node]: Tree.Node[K] }
  if (!n.id && n.uci) n.id = uciToNodeId(n.uci)
  if (!n.children) n.children = []
  n.children.forEach(normalizeBranch)
  return n
}
