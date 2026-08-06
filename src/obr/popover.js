import { OBR } from "./client.js"

const POPOVER_ID = "com.aim-recoil-extension.popover"
const POPOVER_WIDTH = 400
const POPOVER_HEIGHT = 300

async function animateHeight(from,to,duration){

    const start = performance.now()

    return new Promise(resolve=>{

        function frame(now){

            const t = Math.min((now-start)/duration,1)

            const eased = 1-Math.pow(1-t,3)

            const h = Math.round(
                from+(to-from)*eased
            )

            OBR.popover.setHeight(
                POPOVER_ID,
                h
            )

            if(t<1){

                requestAnimationFrame(frame)

            }else{

                resolve()

            }

        }

        requestAnimationFrame(frame)

    })

}

export async function startPopover(){

    await new Promise(resolve=>OBR.onReady(resolve))

    await OBR.popover.open({

        id: POPOVER_ID,

        url:"/Aim-Recoil-Extension/overlay.html",

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

    console.log("POPOVER OPENED")

}


export async function showPopover(){

    console.log("SHOW POPOVER START")

    await OBR.popover.setWidth(
        POPOVER_ID,
        POPOVER_WIDTH
    )

    await OBR.popover.setHeight(
        POPOVER_ID,
        0
    )

    await animateHeight(
        0,
        POPOVER_HEIGHT,
        180
    )

}

export async function hidePopover(){

    await animateHeight(
        POPOVER_HEIGHT,
        0,
        180
    )

    await OBR.popover.setWidth(
        POPOVER_ID,
        0
    )

    await OBR.popover.setHeight(
        POPOVER_ID,
        0
    )

}