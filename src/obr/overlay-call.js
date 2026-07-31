import { OBR } from "./client.js"

const OVERLAY_ID = "com.aim-recoil-extension.overlay"

export async function openAimOverlay(){

    await OBR.onReady()

    await OBR.popover.open({

        id: OVERLAY_ID,

        url: "/Aim-Recoil-Extension/overlay.html",

        width:400,

        height:400

    })

}