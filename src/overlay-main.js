import "./overlay/overlay.css"

import { OBR } from "./obr/client.js"
import { createApp } from "./overlay/overlay.js"
import { onFire } from "./obr/sync.js"


OBR.onReady(async()=>{

    console.log("Overlay OBR Ready")


    const root = document.querySelector("#app")

    console.log("Overlay Root:", root)


    const overlay = await createApp(root)

    console.log("Overlay App Created")


    await onFire((data)=>{

        console.log("Overlay Fire Received:", data)

        overlay.show(data)

    })


    console.log("Overlay Listener Started")

})