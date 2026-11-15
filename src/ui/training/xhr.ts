import { fetchJSON } from '../../http'
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

export function loadPuzzle(id: number): Promise<PuzzleData> {
  return fetchJSON<PuzzleData>(`/training/${id}/load`, { cache: 'reload' })
}

export function newPuzzle(): Promise<PuzzleData> {
  return fetchJSON<PuzzleData>('/training/new')
}

export function newPuzzlesBatch(num: number, after?: number): Promise<PuzzleSyncData> {
  return fetchJSON<PuzzleSyncData>('/training/batch', {
    method: 'GET',
    query: { nb: num, after },
    cache: 'reload',
  })
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
