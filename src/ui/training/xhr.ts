import { fetchJSON, ErrorResponse } from '../../http'
import { numberToBase62 } from '../../utils'
import { ApiPuzzleData, fromApiPuzzle } from './adapter'
import { PuzzleData, PuzzleSyncData, RoundData, PuzzleOutcome } from '../../lichess/interfaces/training'

interface CompleteData {
  readonly round?: {
    readonly win: boolean
    readonly ratingDiff?: number
    readonly vote?: boolean
  }
  readonly next?: {
    readonly user?: { readonly rating: number }
  }
}

// The endpoint this app used to send a puzzle result to was switched off by
// lichess.org; this is the one the website uses.
export function round(outcome: PuzzleOutcome, realId: string): Promise<RoundData> {
  return fetchJSON<CompleteData>(`/training/complete/mix/${realId}`, {
    method: 'POST',
    body: JSON.stringify({
      win: outcome.win,
      rated: true
    })
  })
  .then(data => ({
    round: {
      win: outcome.win,
      userRatingDiff: data.round && data.round.ratingDiff || 0
    },
    user: data.next && data.next.user ? {
      rating: Math.round(data.next.user.rating),
      recent: []
    } : undefined,
    voted: data.round && data.round.vote !== undefined ? data.round.vote : null
  }))
}

export function vote(id: number, v: boolean): Promise<[boolean, number]> {
  return fetchJSON(`/training/${id}/vote`, {
    method: 'POST',
    body: JSON.stringify({
      vote: v ? 1 : 0
    })
  })
}

/*
 * Puzzles are read from the former mobile endpoints of lichess.org, which give
 * the logged in user puzzles of their level. Would lichess.org remove or
 * block them, the app falls back to the public puzzle API, whose puzzles are
 * converted to the same format.
 */
function withPublicApiFallback<T>(legacy: Promise<T>, fallback: () => Promise<T>): Promise<T> {
  return legacy.catch((err: ErrorResponse) => {
    // offline, or not logged in: the public API is not going to help
    if (!err || err.status === 0 || err.status === 401) throw err
    return fallback().catch(() => { throw err })
  })
}

interface ApiPuzzleBatch {
  readonly puzzles: ReadonlyArray<ApiPuzzleData>
  readonly glicko?: { readonly rating: number }
}

function apiPuzzlesBatch(num: number): Promise<PuzzleSyncData> {
  return fetchJSON<ApiPuzzleBatch>('/api/puzzle/batch/mix', {
    query: { nb: Math.max(1, Math.min(num, 50)) },
    cache: 'reload',
  })
  .then(data => ({
    puzzles: data.puzzles.map(fromApiPuzzle),
    user: { rating: data.glicko ? Math.round(data.glicko.rating) : 1500, recent: [] },
  }))
}

export function dailyPuzzle(): Promise<PuzzleData> {
  return withPublicApiFallback(
    fetchJSON<PuzzleData>('/training/daily', undefined),
    () => fetchJSON<ApiPuzzleData>('/api/puzzle/daily').then(fromApiPuzzle)
  )
}

export function loadPuzzle(id: number): Promise<PuzzleData> {
  return withPublicApiFallback(
    fetchJSON<PuzzleData>(`/training/${id}/load`, { cache: 'reload' }),
    () => fetchJSON<ApiPuzzleData>(`/api/puzzle/${numberToBase62(id)}`).then(fromApiPuzzle)
  )
}

export function newPuzzle(): Promise<PuzzleData> {
  return withPublicApiFallback(
    fetchJSON<PuzzleData>('/training/new'),
    () => apiPuzzlesBatch(1).then(data => data.puzzles[0])
  )
}

export function newPuzzlesBatch(num: number, after?: number): Promise<PuzzleSyncData> {
  return withPublicApiFallback(
    fetchJSON<PuzzleSyncData>('/training/batch', {
      method: 'GET',
      query: { nb: num, after },
      cache: 'reload',
    }),
    () => apiPuzzlesBatch(num)
  )
}

// lichess.org now only takes the last solution of a batch into account, so
// they are sent one at a time
export function solvePuzzlesBatch(outcomes: ReadonlyArray<PuzzleOutcome>): Promise<void> {
  return outcomes.reduce(
    (acc, outcome) => acc.then(() =>
      fetchJSON('/training/batch', {
        method: 'POST',
        body: JSON.stringify({
          solutions: [outcome]
        })
      })
    ),
    Promise.resolve()
  )
}
