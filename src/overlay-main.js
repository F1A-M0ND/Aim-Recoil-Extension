import "./overlay/overlay.css"

import { createApp } from "./overlay/overlay"
import { onFire } from "./obr/sync"

const root = document.querySelector("#app")

const overlay = await createApp(root)

onFire(async(data)=>{

    overlay.show(data)

})