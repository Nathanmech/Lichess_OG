import { fetchJSON } from '../../http'
import globalConfig from '../../config'
import { Streamer } from '../../lichess/interfaces'
import { PuzzleData } from '../../lichess/interfaces/training'
import { TournamentListItem } from '../../lichess/interfaces/tournament'

interface FeaturedTournamentData {
  featured: TournamentListItem[]
}

interface LiveStreamer {
  readonly id: string
  readonly name: string
  readonly title?: string
  readonly patron?: boolean
  readonly stream: { readonly status: string }
  readonly streamer: { readonly twitch?: string, readonly youtube?: string }
}

export function featuredStreamers(): Promise<readonly Streamer[]> {
  return fetchJSON<readonly LiveStreamer[]>('/api/streamer/live', undefined)
  .then(streamers => streamers.map(s => ({
    url: s.streamer.twitch || s.streamer.youtube || `${globalConfig.apiEndPoint}/streamer/${s.id}`,
    status: s.stream.status,
    user: { id: s.id, name: s.name, title: s.title, patron: s.patron },
  })))
}

export function dailyPuzzle(): Promise<PuzzleData> {
  return fetchJSON('/training/daily', undefined)
}

export function featuredTournaments(): Promise<FeaturedTournamentData> {
  return fetchJSON('/tournament/featured', undefined)
}
