import { OBR } from "./client.js"

const OVERLAY_ID = "com.aim-recoil-extension.overlay"

export async function openAimOverlay(){

    await new Promise(resolve=>{
        OBR.onReady(resolve)
    })

    await OBR.popover.open({
        id: OVERLAY_ID,
        url: "https://f1a-m0nd.github.io/Aim-Recoil-Extension/overlay.html",
        width:400,
        height:400
    })
}