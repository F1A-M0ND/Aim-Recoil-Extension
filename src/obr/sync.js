import { OBR } from "./client.js"

const CHANNEL = "com.aim-recoil-extension.fire"

export async function sendFire(payload){

    if(!OBR.broadcast){
        console.log("broadcast unavailable")
        return
    }

    try{

        const playerId = await OBR.player.getId()

        await OBR.broadcast.sendMessage(CHANNEL,{
            ...payload,
            playerId
        })

    }catch(error){

        console.log("sendFire error:", error)

    }
}

export function onFire(callback){

    if(!OBR.broadcast){
        console.log("broadcast unavailable")
        return ()=>{}
    }

    console.log("OBR.broadcast =", OBR.broadcast)
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