import "./overlay/overlay.css"
import { createOverlayQueue } from "./queue/overlayQueue.js"

import { OBR } from "./obr/client.js"
import { createApp } from "./overlay/overlay.js"
import { onFire } from "./obr/sync.js"
import { showPopover } from "./obr/popover.js"


OBR.onReady(async()=>{

    const root=document.querySelector("#app")

    const overlay=await createApp(root)

    console.log("Overlay Visible")


    const queue = createOverlayQueue(overlay)

    await onFire((data)=>{

        queue.enqueue(data)

    })

})