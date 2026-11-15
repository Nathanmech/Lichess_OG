import { Browser } from '@capacitor/browser'
import globalConfig from '../config'
import session from '../session'

export function openWebsitePage(path: string, _withoutAuth = false) {
  const anonUrl = `${globalConfig.apiEndPoint}${path}`
  // we don't want to open a internal browser in kid mode since it is not
  // protected like the device browser can be
  if (!session.isKidMode()) {
    // lichess.org removed the endpoint that created a login token for the
    // browser: website pages now open with the browser's own session
    Browser.open({ url: anonUrl })
  } else {
    openExternalBrowser(anonUrl)
  }
}

export function openExternalBrowser(url: string): void {
  window.open(url, '_blank')
}
