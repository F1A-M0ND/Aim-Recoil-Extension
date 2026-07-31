import { OBR } from "./client.js"

const CHANNEL = "com.aim-recoil-extension.fire"


async function waitBroadcast(){

    await OBR.onReady()

    if(!OBR.broadcast){
        console.log("broadcast unavailable")
        return false
    }

    return true
}



export async function sendFire(payload){

    if(!(await waitBroadcast()))
        return


    try{

        const playerId = await OBR.player.getId()

        await OBR.broadcast.sendMessage(
            CHANNEL,
            {
                ...payload,
                playerId
            }
        )


    }catch(error){

        console.log("sendFire error:", error)

    }
}



export async function onFire(callback){


    if(!(await waitBroadcast()))
        return ()=>{}


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