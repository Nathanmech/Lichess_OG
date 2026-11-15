import { fromApiPuzzle } from '../adapter'
import { uciToNodeId } from '../branch'
import { base62ToNumber, numberToBase62 } from '../../../utils'

// same puzzle as answered by lichess.org /api/puzzle/daily and by the former
// mobile endpoint /training/daily
const apiPuzzle = {
  game: {
    id: 'DK2Cv28z',
    perf: { key: 'rapid', name: 'Rapid' },
    rated: true,
    players: [
      { name: 'Naz228', id: 'naz228', color: 'white' as Color, rating: 1937 },
      { name: 'kolombz', id: 'kolombz', color: 'black' as Color, rating: 1974 }
    ],
    pgn: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bc4 e6 Bb3 Be7 f4 Qc7 Be3 b5 a3 O-O O-O Bb7 Qf3 Nc6 Kh1 Nd7 f5 Nxd4 Bxd4 e5 Be3 Nc5 Bd5 Rad8 Bxb7 Qxb7 Nd5 f6 Qg4 Rf7 Rf3 Bf8 Rh3 Na4 b3 Nc5 Qh5 h6 Qg4 Kh8 Rg3 Be7 b4 Na4 Qg6 Rdf8 Rh3 Bd8 Bxh6 gxh6',
    clock: '10+0'
  },
  puzzle: {
    id: 'f9Xve',
    rating: 1882,
    plays: 107579,
    solution: ['g6h6', 'f7h7', 'h6f8'],
    themes: ['deflection', 'mateIn2'],
    initialPly: 59
  }
}

describe('public API puzzle adapter', () => {
  const data = fromApiPuzzle(apiPuzzle)

  it('finds the same ids, ply and color as the former mobile format', () => {
    expect(data.puzzle.id).toBe(454583721)
    expect(data.puzzle.realId).toBe('f9Xve')
    expect(data.puzzle.initialPly).toBe(60)
    expect(data.puzzle.color).toBe('white')
    expect(data.puzzle.gameId).toBe('DK2Cv28z')
  })

  it('rebuilds the position before the puzzle', () => {
    expect(data.puzzle.fen).toBe('3b1r1k/1q3rp1/p2p1pQB/1p1NpP2/nP2P3/P6R/2P3PP/R6K b - - 0 30')
  })

  it('rebuilds the opponent move', () => {
    const node = data.game.treeParts
    expect(node.uci).toBe('g7h6')
    expect(node.san).toBe('gxh6')
    expect(node.id).toBe('YR')
    expect(node.ply).toBe(60)
    expect(node.fen.split(' ')[0]).toBe('3b1r1k/1q3r2/p2p1pQp/1p1NpP2/nP2P3/P6R/2P3PP/R6K')
  })

  it('rebuilds the solution', () => {
    expect(data.puzzle.lines).toEqual({ g6h6: { f7h7: { h6f8: 'win' } } })
    const first = data.puzzle.branch
    const second = first.children[0]
    const third = second.children[0]
    expect([first.san, second.san, third.san]).toEqual(['Qxh6+', 'Rh7', 'Qxf8#'])
    expect([first.ply, second.ply, third.ply]).toEqual([61, 62, 63])
    expect(first.fen).toBe('3b1r1k/1q3r2/p2p1p1Q/1p1NpP2/nP2P3/P6R/2P3PP/R6K b - - 0 31')
    expect(third.fen).toBe('3b1Q1k/1q5r/p2p1p2/1p1NpP2/nP2P3/P6R/2P3PP/R6K b - - 0 32')
    expect(third.children).toEqual([])
  })
})

describe('node ids', () => {
  it('match lichess.org ids', () => {
    expect(uciToNodeId('g7h6')).toBe('YR')
  })
})

describe('puzzle id conversion', () => {
  it('is the inverse of base62ToNumber', () => {
    expect(numberToBase62(454583721)).toBe('f9Xve')
    expect(base62ToNumber(numberToBase62(454583721))).toBe(454583721)
    expect(numberToBase62(0)).toBe('AAAAA')
  })
})
