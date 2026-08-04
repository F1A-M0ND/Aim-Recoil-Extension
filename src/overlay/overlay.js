import "./overlay.css"

import {createImpactLayer, showImpact} from "../effect/impact.js"
import { AIM_SIZE } from "../logic/calculator.js"

const SHOT_COLORS = {
    0:"#ff6b6b",
    1:"#4dabf7",
    2:"#51cf66",
    3:"#845ef7",
    4:"#fcc419",
    5:"#ff922b",
    6:"#20c997",
    7:"#e599f7",
    8:"#74c0fc",
    9:"#adb5bd"
}

function getShotColor(number){

    return SHOT_COLORS[number % 10]

}

function tableMarkup(shots=[]){

    const cells = `

<div class="aim-zone miss"></div>

<div class="aim-zone bad"></div>

<div class="aim-zone good"></div>

<div class="aim-zone perfect"></div>

`


    const markers = shots.map(
        ({x,y,number})=>{


            const left =
                ((x-.5)/AIM_SIZE)*100


            const top =
                ((y-.5)/AIM_SIZE)*100


            return `
            <button
            class="shot-marker"
            style="
            left:${left}%;
            top:${top}%;
            --marker-colour:${getShotColor(number)};
            "
            >
            ${number}
            </button>
            `

        }
    ).join("")


    return `

    <div class="aim-grid">
        ${cells}
    </div>

    <div class="aim-rings">
        <i></i>
        <i></i>
        <i></i>
        <b></b>
        <em></em>
    </div>


    <div class="marker-layer">
        ${markers}
    </div>

    `

}

function fireDelay(rpm){

    if(Number(rpm) <= 0)
        return Infinity

    return 60000 / Number(rpm)

}

export async function createApp(root){

    let animationId = 0

    root.innerHTML = `

<div class="overlay-root">

    <div class="overlay-header">
        <div class="player-name" id="player-name"></div>

        <div class="shot-count" id="shot-count">
            Shots: 0
        </div>
    </div>
    <div class="overlay-body">

        <div class="overlay-table">
        <div class="aim-table" id="overlay-aim-table">
        </div>
    </div>

    <div class="overlay-info">

        <div class="result-line perfect">
            Perfect
            <span id="perfect-count">0</span>
        </div>


        <div class="result-line good">
            Good
            <span id="good-count">0</span>
        </div>


        <div class="result-line bad">
            Bad
            <span id="bad-count">0</span>
        </div>


        <div class="result-line miss">
            Miss
            <span id="miss-count">0</span>
        </div>

    </div>

</div>

`

    async function playOverlayAnimation(
        shots,
        rpm,
        animation
    ){

        const visibleShots = []

        if(rpm <= 0){

            for(const shot of shots){

                visibleShots.push(shot)

            }

            const impactLayer = table.querySelector(".impact-layer")

            table.innerHTML = tableMarkup(
                visibleShots
            )

            if(impactLayer){
                table.appendChild(impactLayer)
            }

            for(const shot of shots){

                if(animation !== animationId){
                    return
                }

                showImpact(
                    shot.x,
                    shot.y
                )

            }

            return

        }

        const delayTime = fireDelay(rpm)

        for(const shot of shots){

            visibleShots.push(shot)

            const impactLayer = table.querySelector(".impact-layer")

            table.innerHTML = tableMarkup(
                visibleShots
            )

            if (impactLayer) {
                table.appendChild(impactLayer)
            }

            if(animation !== animationId){
                return
            }

            showImpact(
                shot.x,
                shot.y
            )

            await new Promise(
                r=>setTimeout(r,delayTime)
            )

        }

    }

    const table = root.querySelector("#overlay-aim-table")



    table.innerHTML = tableMarkup([])

    createImpactLayer(table)

    return {

        async show(data){

            animationId++
            const myAnimation = animationId

            console.log("SHOW OVERLAY",data)

            const impactLayer = table.querySelector(".impact-layer")

            table.innerHTML = tableMarkup([])

            if (impactLayer) {
                table.appendChild(impactLayer)
            }
            
            root.querySelector("#shot-count").textContent =
                `Shots: ${data.shots?.length ?? 0}`

            const summary = data.summary ?? {}


            const playerName =
                root.querySelector("#player-name")

            const name =
                data.playerName ?? "Unknown"

            playerName.textContent = name
            playerName.title = name


            root.querySelector("#perfect-count").textContent =
                summary.PERFECT ?? 0


            root.querySelector("#good-count").textContent =
                summary.GOOD ?? 0


            root.querySelector("#bad-count").textContent =
                summary.BAD ?? 0


            root.querySelector("#miss-count").textContent =
                summary.MISS ?? 0


            await playOverlayAnimation(
                data.shots ?? [],
                data.rpm,
                myAnimation
            )

            console.log("Overlay Updated")

        },


        hide(){

            root.querySelector("#player-name").textContent=""

        }

    }

}