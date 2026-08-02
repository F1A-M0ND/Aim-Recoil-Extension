import "./overlay/overlay.css"

import { OBR } from "./obr/client"
import { createApp } from "./overlay/overlay"
import { onFire } from "./obr/sync"

OBR.onReady(async()=>{

    const root = document.querySelector("#app")

    const overlay = await createApp(root)

    await onFire((data)=>{

        overlay.show(data)

    })

})