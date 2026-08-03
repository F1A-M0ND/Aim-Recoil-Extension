import { OBR } from "./client.js"

const CHANNEL = "com.aim-recoil-extension.fire"


function waitOBR(){

    return new Promise(resolve=>{

        OBR.onReady(()=>{

            resolve()

        })

    })

}


export async function sendFire(payload){

    if(!OBR.broadcast){
        console.log("broadcast unavailable")
        return
    }

    try{

        const playerId = await OBR.player.getId()

        const me = await OBR.player.getName()

        await OBR.broadcast.sendMessage(CHANNEL,{
            ...payload,
            playerId,
            playerName: me
        })

    }catch(error){

        console.log("sendFire error:", error)

    }
}


export async function onFire(callback){

    await waitOBR()


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


            await callback(event.data)

        }
    )

}