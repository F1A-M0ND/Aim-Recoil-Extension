import './style.css'
import { isObrAvailable, OBR } from './obr/client.js'
import { createApp } from './ui/app.js'
import { startPopover } from './obr/popover.js'

const root = document.querySelector('#app')

const setAudioStatus = async (unlocked) => {
  if (!isObrAvailable()) return
  await OBR.action.setBadgeText(unlocked ? '\u{1F50A}' : '\u{1F507}')
  await OBR.action.setTitle(`Aim & Recoil System — Audio ${unlocked ? 'enabled' : 'locked'}`)
}

const start = () => createApp(root, { onAudioStatus: setAudioStatus })

if (isObrAvailable()) {
  OBR.onReady(async () => {
    await start()
    await startPopover()
  })
} else {
  start()
}
