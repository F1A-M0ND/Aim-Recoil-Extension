import "./overlay/overlay.css"

import { OBR } from "./obr/client.js"
import { createApp } from "./overlay/overlay.js"
import { onFire } from "./obr/sync.js"
import { createOverlayQueue } from "./queue/overlayQueue.js"

OBR.onReady(async()=>{

    const root = document.querySelector("#app")

    const overlay = await createApp(root)

    const queue = createOverlayQueue(overlay)

    console.log("Overlay Visible")

    await onFire((data, { isLocal })=>{

        const savedSettings = JSON.parse(localStorage.getItem("aim-recoil.settings") || "{}")

        // This is only a local-own-fire preference; remote fire is queued.
        if(isLocal && savedSettings.overlayDisplay === false)
            return

        queue.enqueue(data)

    }, { includeOwn: true })

})
