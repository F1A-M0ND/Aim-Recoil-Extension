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

    await onFire((data)=>{

        queue.enqueue(data)

    })

})