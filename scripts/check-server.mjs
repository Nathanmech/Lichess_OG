#!/usr/bin/env node

/**
 * Checks that lichess.org still answers the calls this app makes with the data
 * shapes it expects. Run it when something stops working, or from time to
 * time: a FAIL line names the call to look at.
 *
 *   node scripts/check-server.mjs
 *
 * Only anonymous GET requests are made. Calls that need a login (account,
 * preferences, puzzle results, tournaments joins...) are not covered.
 */

const api = 'https://lichess.org'
const headers = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 12) Lichobile/7.15.2-og (check-server)',
  'X-Requested-With': 'XMLHttpRequest',
  'Accept': 'application/vnd.lichess.v5+json',
  'Origin': 'http://localhost',
}

const has = (...paths) => data => paths.filter(p => get(data, p) === undefined)
const get = (o, path) => path.split('.').reduce((acc, k) => acc == null ? undefined : acc[k], o)

const user = 'thibault'
const game = 'DK2Cv28z'
const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

const checks = [
  ['/api/status', has('api.current')],
  ['/', has('lobby.pools.0.id')],
  ['/tournament', has('created', 'started', 'finished')],
  ['/tournament/featured', has('featured')],
  ['/api/streamer/live', has('length')],
  ['/training/daily', has('puzzle.id', 'puzzle.realId', 'puzzle.lines', 'puzzle.branch.uci', 'puzzle.initialPly', 'game.treeParts.fen')],
  ['/player', has('bullet.0.username')],
  ['/player/online?nb=5', has('0.username', '0.perfs')],
  [`/api/user/${user}`, has('id', 'username', 'perfs', 'count.all', 'createdAt')],
  [`/api/users/status?ids=${user}`, has('0.id')],
  [`/@/${user}/mini`, has('perfs')],
  [`/@/${user}/all?page=1`, has('paginator.currentPageResults.0.id', 'paginator.currentPageResults.0.players')],
  [`/@/${user}/following?page=1`, has('paginator.currentPageResults.0.user.name')],
  [`/@/${user}/perf/blitz?graph=1`, has('stat', 'perf')],
  ['/api/player/autocomplete?friend=1&object=1&term=thib', has('result.0.name')],
  ['/api/team/all', has('currentPageResults.0.id')],
  ['/study/all/hot?page=1', has('paginator.currentPageResults.0.id')],
  ['/tv/best', has('game.id', 'game.fen', 'player.color', 'opponent.color', 'url.socket')],
  [`/game/${game}/white/analysis`, has('game.id', 'treeParts.0.fen', 'player.color')],
  [`/api/crosstable/${user}/lichess`, has('users', 'nbGames')],
  [`https://explorer.lichess.org/lichess?variant=standard&fen=${encodeURIComponent(startFen)}&topGames=0&recentGames=0`, has('moves.0.uci', 'white', 'draws', 'black'), true],
  ['https://tablebase.lichess.org/standard?fen=8/8/8/8/8/2k5/2p1R3/2K5_w_-_-_0_1', has('category', 'moves'), true],
]

let failures = 0

for (const [path, missing, external] of checks) {
  const url = path.startsWith('http') ? path : api + path
  let line
  try {
    const res = await fetch(url, { headers: external ? { 'Accept': 'application/json' } : headers })
    const text = await res.text()
    if (res.status === 403 && text.includes('Just a moment')) {
      line = 'SKIP  (Cloudflare challenged this machine; try from another network)'
    } else if (!res.ok) {
      failures++
      line = `FAIL  HTTP ${res.status}`
    } else {
      const fields = missing(JSON.parse(text))
      if (fields.length) {
        failures++
        line = `FAIL  missing: ${fields.join(', ')}`
      } else {
        line = 'ok'
      }
    }
  } catch (e) {
    failures++
    line = `FAIL  ${e.message}`
  }
  console.log(`${line.padEnd(6)} ${path.slice(0, 90)}`)
  // stay well under lichess.org rate limits
  await new Promise(r => setTimeout(r, 1000))
}

console.log(failures ? `\n${failures} call(s) need attention` : '\nAll checked calls answer as expected')
process.exit(failures ? 1 : 0)
