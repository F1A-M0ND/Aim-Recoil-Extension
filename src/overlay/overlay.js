import "./overlay.css"
import { OBR } from "../obr/client.js"

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

const REVEAL_TIMING = {

    perfect:300,
    good:600,
    bad:900,
    miss:1200,

    shotCount:1500,

    countDuration:300

}

const POPOVER_ID = "com.aim-recoil-extension.popover"

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
    let autoCloseTimer = null


    root.innerHTML = `

    <button id="close-overlay" class="close-overlay">✕</button>
    
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

            clearTimeout(autoCloseTimer);
            autoCloseTimer = null;

        }

        table.classList.remove("is-firing");
        table.classList.remove("fade-out");

        await OBR.popover.setWidth(
            POPOVER_ID,
            0
        );

        await OBR.popover.setHeight(
            POPOVER_ID,
            0
        );

    }

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

            if(animation !== animationId){
                return
            }

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

    return {

        async show(data){

            animationId++
            const myAnimation = animationId

            if(autoCloseTimer){

                clearTimeout(autoCloseTimer)

            }

            autoCloseTimer = setTimeout(()=>{

                closeOverlay();

            },5000);

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
                    data.shots?.length ?? 0
                )

            },REVEAL_TIMING.shotCount)

            setTimeout(()=>{

                table.classList.remove("is-firing")

            },1000)

            console.log("Overlay Updated")

        },

        hide(){
            closeOverlay()
            root.querySelector("#player-name").textContent=""

        }

    }

}