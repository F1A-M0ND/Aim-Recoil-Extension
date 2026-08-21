import "./overlay.css"

import {
    showPopover,
    hidePopover
} from "../obr/popover.js"

import {createImpactLayer, showImpact} from "../effect/impact.js"
import { AIM_SIZE, getCriticalMissDirection } from "../logic/calculator.js"

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

const REVEAL_TIMING = {

    perfect:300,
    good:600,
    bad:900,
    miss:1200,

    shotCount:1500,

    countDuration:300

}


function getShotColor(number){

    return SHOT_COLORS[number % 10]

}

function getRoundColor(number){

    return SHOT_COLORS[(Math.max(1, Number(number)) - 1) % 10]

}

function tableMarkup(shots=[]){

    const cells = `

<div class="aim-zone miss"></div>

<div class="aim-zone bad"></div>

<div class="aim-zone good"></div>

<div class="aim-zone perfect"></div>

`


    const markers = shots.map(
        ({x,y,number,round,result,criticalMissDirection,criticalMissArrow})=>{


            const left =
                ((x-.5)/AIM_SIZE)*100


            const top =
                ((y-.5)/AIM_SIZE)*100

            if(result === "CRITICAL MISS"){
                const direction =
                    criticalMissDirection || getCriticalMissDirection(x, y)

                const clampedLeft =
                    x < .5 ? 0 : x > AIM_SIZE + .5 ? 100 : left

                const clampedTop =
                    y < .5 ? 0 : y > AIM_SIZE + .5 ? 100 : top

                return `
            <button
            class="shot-critical-miss is-${direction}"
            style="
            left:${clampedLeft}%;
            top:${clampedTop}%;
            --marker-colour:${getRoundColor(round ?? number)};
            "
            >
            <span class="shot-critical-miss-dot"></span>
            <span class="shot-critical-miss-triangle"></span>
            </button>
            `
            }

            return `
            <button
            class="shot-marker"
            style="
            left:${left}%;
            top:${top}%;
            --marker-colour:${getRoundColor(round ?? number)};
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

function visibleMarkers(shots, startNumber = 0){
    let markerNumber = startNumber
    return shots.flatMap(shot => shot.subBullets
        ? shot.subBullets.map((bullet, index) => ({ ...bullet, number: ++markerNumber, round: shot.number, subBullet: index + 1 }))
        : [{ ...shot, number: ++markerNumber, round: shot.number }]
    )
}

export async function createApp(root){

    let animationId = 0
    let closeResolver = null
    let autoCloseTimer = null
    let countdownTimer = null
    let autoCloseCancelled = false

    root.innerHTML = `

    <div class="overlay-controls">

    <span id="autoclose-info" class="autoclose-info">
        <a href="#" id="cancel-autoclose">Cancel</a>
        close in <span id="autoclose-count">5</span>s
    </span>

    <button id="close-overlay" class="close-overlay">✕</button>

</div>
    
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

        <div class="result-line perfect hidden-result">
            Perfect
            <span id="perfect-count">0</span>
        </div>


        <div class="result-line good hidden-result">
            Good
            <span id="good-count">0</span>
        </div>


        <div class="result-line bad hidden-result">
            Bad
            <span id="bad-count">0</span>
        </div>


        <div class="result-line miss hidden-result">
            Miss
            <span id="miss-count">0</span>
        </div>

    </div>

</div>

`

    async function closeOverlay(){

        animationId++;

        if(autoCloseTimer){

            clearTimeout(autoCloseTimer)
            autoCloseTimer = null

        }

        clearInterval(countdownTimer)

        autoCloseCancelled = false

        table.classList.remove("is-firing");
        table.classList.remove("fade-out");
        await hidePopover();

        if(closeResolver){

            closeResolver()

            closeResolver = null

        }
    }

    async function playOverlayAnimation(
        shots,
        rpm,
        animation
    ){

        const visibleShots = []

        if(rpm <= 0){

            visibleShots.push(...visibleMarkers(shots))

            const impactLayer = table.querySelector(".impact-layer")

            table.innerHTML = tableMarkup(
                visibleShots
            )

            if(impactLayer){
                table.appendChild(impactLayer)
            }

            for(const shot of visibleShots){

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

            if(animation !== animationId){
                return
            }

            const markers = visibleMarkers([shot], visibleShots.length)
            visibleShots.push(...markers)

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

            for(const marker of markers){
                showImpact(marker.x, marker.y)
            }

            await new Promise(
                r=>setTimeout(r,delayTime)
            )

        }

    }

    const table = root.querySelector("#overlay-aim-table")


    function revealResult(selector,value,delay,animation){

        setTimeout(()=>{

            if(animation !== animationId)
                return


            const box =
                root.querySelector(selector)


            box.classList.add(
                "show-result"
            )


            box.querySelector("span").textContent =
                value


        },delay)

    }

    function animateShotCount(target){

        const el =
            root.querySelector("#shot-count")


        const start =
            performance.now()


        const duration =
            REVEAL_TIMING.countDuration


        function update(now){

            const progress =
                Math.min(
                    (now-start)/duration,
                    1
                )


            const value =
                Math.floor(
                    target * progress
                )


            el.textContent =
                `Shots: ${value}`


            if(progress < 1){
                requestAnimationFrame(update)
            }

        }


        requestAnimationFrame(update)

    }

    table.innerHTML = tableMarkup([])

    createImpactLayer(table)

    root.querySelector("#close-overlay")
        .addEventListener(
            "click",
            closeOverlay
        )

    root.querySelector("#cancel-autoclose")
        .addEventListener("click",(e)=>{

            e.preventDefault()

            autoCloseCancelled = true

            clearTimeout(autoCloseTimer)
            clearInterval(countdownTimer)

            root.querySelector("#autoclose-info").innerHTML = `Auto close cancelled`

        })

    return {

        async show(data){

            animationId++
            const myAnimation = animationId

            autoCloseCancelled = false

            const info =
                root.querySelector("#autoclose-info")

            info.innerHTML = `
    <a href="#" id="cancel-autoclose">Cancel</a>
    close in <span id="autoclose-count">5</span>s
`
            root.querySelector("#cancel-autoclose")
                .addEventListener("click",(e)=>{

                    e.preventDefault()

                    autoCloseCancelled = true

                    clearTimeout(autoCloseTimer)
                    clearInterval(countdownTimer)

                    root.querySelector("#autoclose-info").innerHTML =
                        "Auto close cancelled"

                })

            const counter =
                root.querySelector("#autoclose-count")

            counter.textContent = "5"

            clearTimeout(autoCloseTimer)
            clearInterval(countdownTimer)

            autoCloseTimer = null
            countdownTimer = null

            autoCloseTimer = setTimeout(()=>{

                if(!autoCloseCancelled){

                    closeOverlay()

                }

            },7000)

            table.classList.add("is-firing")

            const playerName =
                root.querySelector("#player-name")

            const name =
                data.playerName ?? "Unknown"

            playerName.textContent = name
            playerName.title = name

            console.log("SHOW OVERLAY",data)


            const impactLayer =
                table.querySelector(".impact-layer")


            table.innerHTML =
                tableMarkup([])

            root.querySelectorAll(
                ".result-line"
            )
                .forEach(
                    e=>e.classList.remove("show-result")
                )

            if(impactLayer){
                table.appendChild(impactLayer)
            }

            root.querySelector("#shot-count").textContent =
                "Shots: 0"

            // รอมืด 1 วิ ก่อนยิงจริง
            await new Promise(
                r=>setTimeout(r,1000)
            )

            if (impactLayer) {
                table.appendChild(impactLayer)
            }



            const summary = data.summary ?? {}

            const infoValues = {
                perfect: summary.PERFECT ?? 0,
                good: summary.GOOD ?? 0,
                bad: summary.BAD ?? 0,
                miss: summary.MISS ?? 0
            }

            await playOverlayAnimation(
                data.shots ?? [],
                data.rpm,
                myAnimation
            )

            // ยิงเสร็จ

            table.classList.add("fade-out")

            let remain = 5

            clearInterval(countdownTimer)

            countdownTimer = setInterval(()=>{

                if(autoCloseCancelled){

                    clearInterval(countdownTimer)
                    return

                }

                remain--

                if(remain <= 0){

                    remain = 0

                    clearInterval(countdownTimer)

                }

                counter.textContent = remain

            },1000)

            // เริ่ม fade ทันที
            // fade ต้องใช้เวลา 1000ms

            setTimeout(()=>{

                table.classList.remove("fade-out")

            },1000)


            // result timeline แยก
            revealResult(
                ".result-line.perfect",
                infoValues.perfect,
                REVEAL_TIMING.perfect,
                myAnimation
            )

            revealResult(
                ".result-line.good",
                infoValues.good,
                REVEAL_TIMING.good,
                myAnimation
            )

            revealResult(
                ".result-line.bad",
                infoValues.bad,
                REVEAL_TIMING.bad,
                myAnimation
            )

            revealResult(
                ".result-line.miss",
                infoValues.miss,
                REVEAL_TIMING.miss,
                myAnimation
            )


            setTimeout(()=>{

                animateShotCount(
                    data.shotCount ?? data.shots?.length ?? 0
                )

            },REVEAL_TIMING.shotCount)

            setTimeout(()=>{

                table.classList.remove("is-firing")

            },1000)

            console.log("Overlay Updated")

        },

        waitUntilClosed(){

            return new Promise(resolve=>{

                closeResolver = resolve

            })

        },

        hide(){
            closeOverlay()
            root.querySelector("#player-name").textContent=""

        }

    }

}
