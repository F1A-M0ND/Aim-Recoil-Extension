import './style.css'
import { isObrAvailable, OBR } from './obr/client.js'
import { createApp } from './ui/app.js'
import { onFire } from "./obr/sync"
import { showFireEffect } from "./obr/effect"
import { startPopover } from "./obr/popover.js"
import { showPopover } from "./obr/popover.js"

const root = document.querySelector('#app')

const setAudioStatus = async (unlocked) => {
    if (!isObrAvailable()) return

    await OBR.action.setBadgeText(unlocked ? "🔊" : "🔇")
    await OBR.action.setTitle(`Aim & Recoil System — Audio ${unlocked ? "enabled" : "locked"}`)
}

const start = () =>
    createApp(root, {
        isConnected: isObrAvailable(),
        onAudioStatus: setAudioStatus
    })

if (isObrAvailable()) {

    OBR.onReady(async () => {

        await start()

        await startPopover()

    })

} else {

    start()

}
