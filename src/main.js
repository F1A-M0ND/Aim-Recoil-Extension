import './style.css'
import { isObrAvailable, OBR } from './obr/client.js'
import { createApp } from './ui/app.js'
import { onFire } from "./obr/sync"
import { showFireEffect } from "./obr/effect"
import { startPopover } from "./obr/popover.js"
import { showPopover } from "./obr/popover.js"

const root = document.querySelector('#app')

const start = () =>
    createApp(root, {
        isConnected: isObrAvailable()
    })

if (isObrAvailable()) {

    OBR.onReady(async () => {

        start()

        await startPopover()

        setTimeout(async () => {

            console.log("SHOW")

            await showPopover()

            console.log("SHOW DONE")

        }, 3000)

    })

} else {

    start()

}