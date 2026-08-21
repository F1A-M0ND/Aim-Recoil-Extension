import "./overlay/overlay.css"

import { OBR } from "./obr/client.js"
import { createApp } from "./overlay/overlay.js"
import { onFire } from "./obr/sync.js"
import { createOverlayQueue } from "./queue/overlayQueue.js"

const SETTINGS_KEY = "aim-recoil.settings"

function readSettings(){

    try{

        return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")

    }catch{

        return {}

    }
}

OBR.onReady(async()=>{

    const root = document.querySelector("#app")

    const overlay = await createApp(root)

    const queue = createOverlayQueue(overlay)

    console.log("Overlay Visible")

    await onFire((data, { isLocal })=>{

        const savedSettings = readSettings()

        // This is only a local-own-fire preference; remote fire is queued.
        if(isLocal && savedSettings.overlayDisplay === false)
            return

        queue.enqueue(data)

    }, { includeOwn: true })

})
