import { UserFullProfile, GameFilter, UserGameWithDate, PerfStats } from '../../lichess/interfaces/user'
import { Paginator } from '../../lichess/interfaces'
import { OnlineGameData } from '../../lichess/interfaces/game'
import { Related } from '../../lichess/interfaces/user'
import { fetchJSON } from '../../http'
import { normalizeProfile } from '../../lichess/profile'

export interface FilterResult {
  filter: GameFilter
  paginator: Paginator<UserGameWithDate>
}

export interface RelatedResult {
  paginator: Paginator<Related>
}

export interface RelationActionResult {
  followable: boolean
  following: boolean
  blocking: boolean
}

// the server calls that filter 'imported'
const serverFilter = (filter: string) => filter === 'import' ? 'imported' : filter

export function games(userId: string, filter = 'all', page = 1, feedback = false): Promise<FilterResult> {
  return fetchJSON(`/@/${userId}/${serverFilter(filter)}`, {
    query: {
      page
    }
  }, feedback)
}

// lichess.org now sends the user as a light user object
interface ServerRelated extends Omit<Related, 'user' | 'title' | 'patron'> {
  readonly user: string | { readonly name: string, readonly title?: string, readonly patron?: boolean }
}

function normalizeRelated(r: ServerRelated): Related {
  if (typeof r.user === 'string') return r as unknown as Related
  return {
    ...r,
    user: r.user.name,
    title: r.user.title,
    patron: !!r.user.patron,
    online: !!r.online,
  } as unknown as Related
}

export function following(userId: string, page = 1): Promise<RelatedResult> {
  return fetchJSON<{ paginator: Paginator<ServerRelated> }>(`/@/${userId}/following`, {
    query: {
      page
    }
  })
  .then(data => ({
    paginator: {
      ...data.paginator,
      currentPageResults: data.paginator.currentPageResults.map(normalizeRelated)
    }
  }))
}

// relation actions now answer with a bare `{ok: true}`: read the resulting
// relation from the user endpoint
function relationAction(action: string, userId: string): Promise<RelationActionResult> {
  return fetchJSON(`/rel/${action}/${userId}`, { method: 'POST' })
  .then(() => fetchJSON<UserFullProfile>(`/api/user/${userId}`, { cache: 'reload' }))
  .then(u => ({
    followable: !!u.followable,
    following: !!u.following,
    blocking: !!u.blocking,
  }))
}

export function follow(userId: string): Promise<RelationActionResult> {
  return relationAction('follow', userId)
}

export function unfollow(userId: string): Promise<RelationActionResult> {
  return relationAction('unfollow', userId)
}

export function block(userId: string): Promise<RelationActionResult> {
  return relationAction('block', userId)
}

export function unblock(userId: string): Promise<RelationActionResult> {
  return relationAction('unblock', userId)
}

interface UserStatus {
  readonly id: string
  readonly online?: boolean
}

export function user(id: string, feedback = true): Promise<UserFullProfile> {
  return Promise.all([
    fetchJSON<UserFullProfile>(`/api/user/${id}`, undefined, feedback),
    // online status is no longer part of the user data
    fetchJSON<ReadonlyArray<UserStatus>>('/api/users/status', { query: { ids: id } })
    .catch(() => [] as ReadonlyArray<UserStatus>)
  ])
  .then(([u, status]) => ({
    ...u,
    online: u.online !== undefined ? u.online : status.some(s => !!s.online),
    profile: normalizeProfile(u.profile),
  }))
}

export function tv(userId: string): Promise<OnlineGameData> {
  return fetchJSON(`/@/${userId}/tv`)
}

export function variantperf(userId: string, perfKey: PerfKey): Promise<PerfStats> {
  return fetchJSON(`/@/${userId}/perf/${perfKey}?graph=1`, undefined, false)
}
