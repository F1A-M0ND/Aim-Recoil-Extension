import { OBR } from "./client.js"

const POPOVER_ID = "com.aim-recoil-extension.popover"
const POPOVER_WIDTH = 400
const POPOVER_HEIGHT = 400

export async function startPopover(){

    await new Promise(resolve=>OBR.onReady(resolve))

    await OBR.popover.open({

        id: POPOVER_ID,

        url: "/Aim-Recoil-Extension/overlay.html",

        width:0,
        height:0,

        hidePaper:true,
        disableClickAway:true,
        marginThreshold:0,

        anchorOrigin:{
            horizontal:"RIGHT",
            vertical:"BOTTOM"
        },

        transformOrigin:{
            horizontal:"RIGHT",
            vertical:"BOTTOM"
        }

    })

}

export async function showPopover(){

    await OBR.popover.setWidth(
        POPOVER_ID,
        POPOVER_WIDTH
    )

    await OBR.popover.setHeight(
        POPOVER_ID,
        POPOVER_HEIGHT
    )

}

export async function hidePopover(){

    await OBR.popover.setWidth(
        POPOVER_ID,
        0
    )

    await OBR.popover.setHeight(
        POPOVER_ID,
        0
    )

}