import "./overlay/overlay.css"
import { createApp } from "./overlay/overlay"

const root = document.querySelector("#app")

await createApp(root)