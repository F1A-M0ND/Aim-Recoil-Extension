import "./overlay.css"

import { createImpactLayer } from "../effect/impact.js"
import { AIM_SIZE } from "../logic/calculator.js"

const CELL_LABEL = {
    PERFECT:'P',
    GOOD:'G',
    BAD:'B',
    MISS:'M'
}

const cssResult = (result)=>
    result.toLowerCase().replace(' ','-')


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

function cellType(x,y){

    if(
        (y===6 || y===7) &&
        (x===6 || x===7)
    )
        return "PERFECT"


    if(
        y>=5 && y<=8 &&
        x>=5 && x<=8
    )
        return "GOOD"


    if(
        y>=3 && y<=10 &&
        x>=3 && x<=10
    )
        return "BAD"


    return "MISS"

}

function tableMarkup(shots=[]){

    let cells=""

    for(let y=1;y<=AIM_SIZE;y++){

        for(let x=1;x<=AIM_SIZE;x++){

            const type = cellType(x,y)

            cells += `
            <span class="aim-cell ${cssResult(type)}">
            ${CELL_LABEL[type]}
            </span>
            `
        }

    }


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

export async function createApp(root){

    root.innerHTML = `
<div class="overlay-root">

    <div class="overlay-panel">

        <div
            class="player-name"
            id="player-name"
            title=""
        ></div>

        <div class="overlay-content">

            <div class="overlay-table">
                <div class="aim-table" id="overlay-aim-table"></div>
            </div>

            <div class="overlay-info">
                ...
            </div>

        </div>

    </div>

</div>
`


    const table = root.querySelector("#overlay-aim-table")

    table.innerHTML = tableMarkup([])

    createImpactLayer(table)


    return {


        async show(data){

            console.log("SHOW OVERLAY",data)

            table.innerHTML = tableMarkup(
                data.shots ?? []
            )

            const summary = data.summary ?? {}

            const playerName =
                data.playerName ?? "Unknown"

            const nameEl =
                root.querySelector("#player-name")

            nameEl.textContent = playerName
            nameEl.title = playerName

            root.querySelector("#player-name").textContent =
                playerName


            root.querySelector("#perfect-count").textContent =
                summary.PERFECT ?? 0


            root.querySelector("#good-count").textContent =
                summary.GOOD ?? 0


            root.querySelector("#bad-count").textContent =
                summary.BAD ?? 0


            root.querySelector("#miss-count").textContent =
                summary.MISS ?? 0


            console.log("Overlay Updated")

        },


        hide(){

            root.querySelector("#player-name").textContent=""

        }

    }

}