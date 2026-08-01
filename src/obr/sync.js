import { OBR } from "./client.js"

const CHANNEL = "com.aim-recoil-extension.fire"

const INSTANCE_ID =
    localStorage.getItem("aim-recoil-instance") ||
    (() => {
        const id = crypto.randomUUID()
        localStorage.setItem(
            "aim-recoil-instance",
            id
        )
        return id
    })()

function waitOBR(){
    return new Promise(resolve=>{
        OBR.onReady(resolve)
    })
}

export async function sendFire(payload){

    await waitOBR()

    console.log("SEND SOURCE:", INSTANCE_ID)

    await OBR.broadcast.sendMessage(
        CHANNEL,
        {
            ...payload,
            source: INSTANCE_ID
        }
    )

}

export async function onFire(callback){

    await waitOBR()

    return OBR.broadcast.onMessage(
        CHANNEL,
        event=>{

            console.log(
                "RECEIVE SOURCE:",
                event.data.source,
                "MY SOURCE:",
                INSTANCE_ID
            )

            if(event.data.source === INSTANCE_ID){
                console.log("IGNORE SELF")
                return
            }

            callback(event.data)

        }
    )

}