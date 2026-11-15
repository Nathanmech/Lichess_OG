import { fetchJSON } from '../../http'
import { Tournament, PlayerInfo, TournamentCreateResponse, TournamentLists, StandingPage } from '../../lichess/interfaces/tournament'

const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

type EmptyObject = Record<string, never>

export function currentTournaments(): Promise<TournamentLists> {
  return fetchJSON('/tournament', {}, true)
}

// lichess.org now sends each team as [name, flair]: keep the name
function normalizeTeams(t: Tournament): Tournament {
  const teams = t.teamBattle && t.teamBattle.teams as { [key: string]: unknown }
  if (teams) {
    Object.keys(teams).forEach(k => {
      const v = teams[k]
      if (Array.isArray(v)) teams[k] = v[0]
    })
  }
  return t
}

export function tournament(id: string): Promise<Tournament> {
  return fetchJSON<Tournament>('/tournament/' + id, {query: {socketVersion: 1, scores: 0}}, true)
  .then(normalizeTeams)
}

export function reload(id: string, page?: number): Promise<Tournament> {
  return fetchJSON<Tournament>('/tournament/' + id,
  {
    method: 'GET',
    query: {
      partial: 1,
      scores: 0,
      ...(page ? { page } : {})
    },
  })
  .then(normalizeTeams)
}

export function loadPage(id: string, p: number): Promise<StandingPage> {
  return fetchJSON('/tournament/' + id + '/standing/' + p, { query: { scores: 0 } })
}

export function join(id: string, password?: string, team?: string): Promise<EmptyObject> {
  return fetchJSON('/tournament/' + id + '/join',
  {
    method: 'POST',
    body: JSON.stringify({
      p: password || null,
      team: team || null
    })
  }, true)
}

export function withdraw(id: string): Promise<EmptyObject> {
  return fetchJSON('/tournament/' + id + '/withdraw', { method: 'POST' }, true)
}

export function playerInfo(tournamentId: string, playerId: string): Promise<PlayerInfo> {
  return fetchJSON('/tournament/' + tournamentId + '/player/' + playerId, {}, true)
}

export function create(name: string, variant: string, position: string, mode: string, clockTime: string, clockIncrement: string, minutes: string, waitMinutes: string, isPrivate: string, password: string): Promise<TournamentCreateResponse> {
  return fetchJSON('/tournament/new', {
    method: 'POST',
    body: JSON.stringify({
      name,
      variant,
      // only a custom starting position is sent; the server takes `rated`
      // where it used to take `mode`
      ...(position && position !== '---' && position !== initialFen ? { position } : {}),
      rated: mode === '1',
      clockTime,
      clockIncrement,
      minutes,
      waitMinutes,
      private: isPrivate,
      password
    })
  }, true)
}
