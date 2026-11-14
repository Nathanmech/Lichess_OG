// Push notifications need Firebase credentials that belong to the official
// lichess.org app, so this build ships without them (same approach as the
// upstream "free" variant: see lichobile commit ead71f89).
export default {
  isStub: true,

  init(): void {},

  register(): Promise<void> {
    return Promise.resolve()
  },

  unregister(): Promise<string> {
    return Promise.resolve('')
  }
}
