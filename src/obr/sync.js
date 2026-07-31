import { OBR } from "./client.js"

const CHANNEL = "com.aim-recoil-extension.fire"


export async function sendFire(payload){

    await OBR.onReady()

    if(!OBR.broadcast){
        console.log("broadcast unavailable")
        return
    }

    try{

        const playerId = await OBR.player.getId()
        console.log("sendFire called", payload)
        await OBR.broadcast.sendMessage(
            CHANNEL,
            {
                ...payload,
                playerId
            }
        )

        console.log("broadcast sent")
    }catch(error){

        console.log("sendFire error:", error)

    }
}



export async function onFire(callback){

    await OBR.onReady()

    if(!OBR.broadcast){
        console.log("broadcast unavailable")
        return ()=>{}
    }


    return OBR.broadcast.onMessage(
        CHANNEL,
        async(event)=>{

            const myId = await OBR.player.getId()

            if(event.data.playerId === myId)
                return


            callback(event.data)

        }
    )
}