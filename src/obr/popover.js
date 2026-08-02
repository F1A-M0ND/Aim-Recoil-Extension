import { OBR } from "./client.js"

const POPOVER_ID = "com.aim-recoil-extension.popover"

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