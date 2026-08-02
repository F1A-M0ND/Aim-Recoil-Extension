import "./overlay/overlay.css"

import { OBR } from "./obr/client.js"
import { createApp } from "./overlay/overlay.js"
import { onFire } from "./obr/sync.js"


OBR.onReady(async()=>{

    const root=document.querySelector("#app")


    const overlay = await createApp(root)


    onFire((data)=>{

        overlay.show(data)

    })


    console.log("Overlay Ready")

})