import { Chess } from 'chessops/chess'
import { parseSan, makeSan } from 'chessops/san'
import { makeFen } from 'chessops/fen'
import { parseUci, makeSquare, kingCastlesTo } from 'chessops/util'
import { Move, isNormal } from 'chessops/types'
import { Tree } from '../shared/tree'
import { base62ToNumber } from '../../utils'
import { PuzzleData, Lines } from '../../lichess/interfaces/training'
import { uciToNodeId } from './branch'

/*
 * Puzzle as sent by the public lichess.org puzzle API (/api/puzzle/...)
 */
export interface ApiPuzzleData {
  readonly game: {
    readonly id: string
    readonly clock: string
    readonly rated: boolean
    readonly perf: { readonly key: string, readonly name: string }
    readonly players: ReadonlyArray<{ readonly name: string, readonly id: string, readonly color: Color }>
    // space separated SAN moves, up to the move that precedes the puzzle
    readonly pgn: string
  }
  readonly puzzle: {
    readonly id: string
    readonly rating: number
    readonly plays: number
    readonly initialPly: number
    readonly solution: ReadonlyArray<string>
  }
}

// uci in the usual e1g1 form for castling (chessops says king takes rook)
function standardUci(pos: Chess, move: Move): string {
  if (!isNormal(move)) return ''
  const side = pos.castlingSide(move)
  const to = side ? kingCastlesTo(pos.turn, side) : move.to
  return makeSquare(move.from) + makeSquare(to) + (move.promotion ? move.promotion[0] : '')
}

function play(pos: Chess, move: Move, ply: number): Tree.Node {
  const uci = standardUci(pos, move)
  const san = makeSan(pos, move)
  pos.play(move)
  return {
    id: uciToNodeId(uci),
    ply,
    fen: makeFen(pos.toSetup()),
    uci,
    san,
    children: []
  }
}

/*
 * Convert a puzzle of the public API to the format this app works with, which
 * is the one of the former lichess.org mobile endpoints. The position before
 * the puzzle is not part of the public format: it is found by replaying the
 * game.
 */
export function fromApiPuzzle(data: ApiPuzzleData): PuzzleData {
  const { game, puzzle } = data
  const sans = game.pgn.split(' ').filter(s => s !== '')
  const pos = Chess.default()
  sans.slice(0, -1).forEach(san => {
    const move = parseSan(pos, san)
    if (!move) throw new Error('Invalid puzzle game: ' + san)
    pos.play(move)
  })
  const fenBefore = makeFen(pos.toSetup())

  const lastMove = parseSan(pos, sans[sans.length - 1])
  if (!lastMove) throw new Error('Invalid puzzle game')
  const treeParts = play(pos, lastMove, puzzle.initialPly + 1)

  const solution = puzzle.solution.map((uci, i) => {
    const move = parseUci(uci)
    if (!move) throw new Error('Invalid puzzle solution: ' + uci)
    return play(pos, pos.normalizeMove(move), puzzle.initialPly + 2 + i)
  })
  solution.forEach((node, i) => {
    if (i > 0) solution[i - 1].children.push(node)
  })

  const lines = puzzle.solution.reduceRight<Lines | 'win'>((acc, uci) => ({ [uci]: acc }), 'win') as Lines

  return {
    puzzle: {
      id: base62ToNumber(puzzle.id) || 0,
      realId: puzzle.id,
      rating: puzzle.rating,
      attempts: puzzle.plays,
      fen: fenBefore,
      color: puzzle.initialPly % 2 === 1 ? 'white' : 'black',
      initialMove: [treeParts.uci!.slice(0, 2), treeParts.uci!.slice(2, 4)] as KeyPair,
      initialPly: puzzle.initialPly + 1,
      gameId: game.id,
      lines,
      enabled: true,
      vote: 0,
      branch: solution[0]
    },
    game: {
      id: game.id,
      clock: game.clock,
      perf: { icon: '', name: game.perf.name },
      players: game.players.map(p => ({ color: p.color, name: p.name, userId: p.id })) as [any, any],
      rated: game.rated,
      treeParts
    }
  }
}
