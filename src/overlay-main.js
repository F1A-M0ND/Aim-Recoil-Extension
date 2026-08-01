import "./overlay/overlay.css"

import { createApp } from "./overlay/overlay"
import { registerOverlay } from "./overlay/manager"
import { onFire } from "./obr/sync"

const root = document.querySelector("#app")

const api = await createApp(root)

registerOverlay(api)

await onFire()