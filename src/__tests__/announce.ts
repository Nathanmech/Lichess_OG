jest.mock('../asyncStorage', () => ({
  __esModule: true,
  default: { get: () => Promise.resolve(null), set: () => Promise.resolve() }
}))
jest.mock('../utils/redraw', () => ({ __esModule: true, default: () => {} }))

import announce from '../announce'

const inOneMinute = () => new Date(Date.now() + 60000).toISOString()

describe('server announcements', () => {
  it('shows a regular announcement', async () => {
    await announce.set({ msg: 'Lichess will restart', date: inOneMinute() })
    expect(announce.get()?.msg).toBe('Lichess will restart')
    await announce.set(undefined)
    expect(announce.get()).toBeUndefined()
  })

  it('discards adverts for the new official app', async () => {
    await announce.set({ msg: 'Upgrade now! lichess.org/app', date: inOneMinute() })
    expect(announce.get()).toBeUndefined()
    await announce.set({ msg: 'Get it at https://Lichess.org/app today', date: inOneMinute() })
    expect(announce.get()).toBeUndefined()
  })

  it('keeps a regular announcement when an advert arrives', async () => {
    await announce.set({ msg: 'Lichess will restart', date: inOneMinute() })
    await announce.set({ msg: 'Upgrade now! lichess.org/app', date: inOneMinute() })
    expect(announce.get()?.msg).toBe('Lichess will restart')
  })
})
