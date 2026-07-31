import { AIM_SIZE } from '../logic/calculator.js'
import { createImpactLayer, showImpact } from '../effect/impact.js'
import { onFire } from "../obr/sync.js"

const CELL_LABEL = { PERFECT: 'P', GOOD: 'G', BAD: 'B', MISS: 'M' }
const cssResult = (result) => result.toLowerCase().replace(' ', '-')

function fireDelay(rpm){
    if(Number(rpm)<=0) return Infinity

    return 60000 / Number(rpm)
}



function cellType(x, y) {
    if ((y === 6 || y === 7) && (x === 6 || x === 7)) return 'PERFECT'
    if (y >= 5 && y <= 8 && x >= 5 && x <= 8) return 'GOOD'
    if (y >= 3 && y <= 10 && x >= 3 && x <= 10) return 'BAD'
    return 'MISS'
}

function tableMarkup(shots = []) {
    let cells = ''

    for (let y = 1; y <= AIM_SIZE; y += 1) {
        for (let x = 1; x <= AIM_SIZE; x += 1) {
            const type = cellType(x, y)
            cells += `<span class="aim-cell ${cssResult(type)}">${CELL_LABEL[type]}</span>`
        }
    }
    const stacks = new Map()
    shots.forEach((shot) => {
        const key = `${shot.x.toFixed(4)}:${shot.y.toFixed(4)}`
        stacks.set(key, [...(stacks.get(key) || []), shot.number])
    })
    const markers = shots.map(({ x, y, number }) => {
        const left = ((Math.max(0, Math.min(13, x)) - .5) / AIM_SIZE) * 100
        const top = ((Math.max(0, Math.min(13, y)) - .5) / AIM_SIZE) * 100

        const stack = stacks.get(`${x.toFixed(4)}:${y.toFixed(4)}`) || []

        const offset = stack.length > 1
            ? (stack.indexOf(number) - (stack.length - 1) / 2) * 5
            : 0

        return `
<button
 class="shot-marker"
 data-shot="${number}"
 style="
   left:${left}%;
   top:${top}%;
   --marker-colour:#4dabf7;
   --stack-offset:${offset}px;
 "
>
 ${number}
</button>
`
    }).join('')
    return `<div class="aim-grid">${cells}</div><div class="aim-rings" aria-hidden="true"><i></i><i></i><i></i><b></b><em></em></div><div class="axis-label axis-x">X AXIS</div><div class="axis-label axis-y">Y AXIS</div><div class="marker-layer" aria-label="Shot markers">${markers}</div>`
}

export async function createApp(root) {
    root.innerHTML = `
<div class="overlay-root">
    <button id="overlay-close">✕</button>

    <div class="aim-panel">
        <div class="aim-table" id="aim-table"></div>
    </div>
</div>
`;
    const table = root.querySelector('#aim-table')
    createImpactLayer(table)
    const overlay = root.querySelector(".overlay-root")
    overlay.classList.add("hidden")
    const closeBtn = root.querySelector("#overlay-close")

    closeBtn.onclick = () => {
        overlay.classList.add("hidden")
    }
    let visibleShots = []
    let globalShots = []
    const renderTable = (global = false) => {
        const oldImpactLayer = table.querySelector('.impact-layer')

        table.innerHTML = tableMarkup(global ? globalShots : visibleShots)

        if (oldImpactLayer) {
            table.appendChild(oldImpactLayer)
        }
    }

    async function playFireAnimation(
        shots,
        rpm,
        global = false
    ) {

        if (rpm <= 0) {

            if (global) {
                globalShots.push(...shots)
            } else {
                visibleShots.push(...shots)
            }

            renderTable(global)

            for (const shot of shots) {
                showImpact(shot.x, shot.y)
            }

            return
        }

        const delayTime = fireDelay(rpm)

        for (const shot of shots) {

            if (global) {
                globalShots.push(shot)
            } else {
                visibleShots.push(shot)
            }

            renderTable(global)
            showImpact(shot.x, shot.y)

            await new Promise(r => setTimeout(r, delayTime))
        }
    }

    try {

        onFire(async ({ shots, rpm }) => {

            console.log("Overlay received", shots, rpm);

            overlay.classList.remove("hidden")

            globalShots = []
            visibleShots = []

            table.classList.add("is-firing")

            await playFireAnimation(
                shots,
                rpm,
                true
            )

            await new Promise(r => setTimeout(r,1000))

            table.classList.remove("is-firing")

        })

    } catch(err){

        console.error("onFire init failed:",err)

    }

    renderTable()
    console.log("Overlay app started");
}
