export interface Friend {
  name: string,
  title?: string
  playing: boolean
  patron: boolean
}

const onlineFriends: Map<string, Friend> = new Map()

export default {
  list(): ReadonlyArray<Friend> {
    return [...onlineFriends.values()].sort((f, f2) => lexicallyCompareFriends(f, f2))
  },
  count(): number {
    return onlineFriends.size
  },
  reset(friends: string[], playings: string[], patrons: string[] ): void {
    onlineFriends.clear()
    friends.forEach(friend => {
      const [name, title] = parseFriend(friend)
      const id = name.toLowerCase()
      const playing = playings.includes(id)
      const patron = patrons.includes(id)
      onlineFriends.set(id, { name, title, playing, patron })
    })
  },
  set(rawName: string, playing: boolean, patron: boolean): void {
    const [name, title] = parseFriend(rawName)
    onlineFriends.set(name.toLowerCase(), { name, title, playing, patron })
  },
  // lichess.org identifies friends by title + name when they come online, and
  // by user id afterwards: always key by user id
  playing(rawName: string): void {
    const id = friendId(rawName)
    const friend = onlineFriends.get(id)
    if (friend) {
      onlineFriends.set(id, { ...friend, playing: true })
    }
  },
  stoppedPlaying(rawName: string): void {
    const id = friendId(rawName)
    const friend = onlineFriends.get(id)
    if (friend) {
      onlineFriends.set(id, { ...friend, playing: false })
    }
  },
  remove(leaving: string): void {
    onlineFriends.delete(friendId(leaving))
  },
  clear(): void {
    onlineFriends.clear()
  },
}

function friendId(rawName: string): string {
  return parseFriend(rawName)[0].toLowerCase()
}

function parseFriend(friend: string): [string, string | undefined] {
  const splitted = friend.split(' ')
  const name = splitted.length > 1 ? splitted[1] : splitted[0]
  const title = splitted.length > 1 ? splitted[0] : undefined
  return [name, title]
}

function lexicallyCompareFriends(friend1: Friend, friend2: Friend) {
  if (friend1.name.toLowerCase() < friend2.name.toLowerCase())
    return -1
  else if (friend1.name.toLowerCase() > friend2.name.toLowerCase())
    return 1
  else
    return 0
}
