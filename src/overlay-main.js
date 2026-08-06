import "./overlay/overlay.css"

import { OBR } from "./obr/client.js"
import { createApp } from "./overlay/overlay.js"
import { onFire } from "./obr/sync.js"
import { showPopover } from "./obr/popover.js"


OBR.onReady(async()=>{

    const root=document.querySelector("#app")

    const overlay=await createApp(root)

    console.log("Overlay Visible")


    await onFire(async (data) => {

        await Promise.all([
            showPopover(),
            overlay.show(data)
        ])

    })

})