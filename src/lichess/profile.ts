import { Profile } from '../session'

interface ServerProfile extends Profile {
  readonly flag?: string
  readonly realName?: string
}

// lichess.org renamed `country` to `flag` and merged `firstName`/`lastName`
// into `realName`; bring a profile back to the shape the app works with
export function normalizeProfile<T extends ServerProfile>(profile: T | undefined): T | undefined {
  if (!profile) return profile
  return {
    ...profile,
    country: profile.country !== undefined ? profile.country : profile.flag,
    firstName: profile.firstName !== undefined || profile.lastName !== undefined ?
      profile.firstName : profile.realName,
  }
}
