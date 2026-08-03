import "./overlay.css"

import { createImpactLayer, showImpact } from "../effect/impact.js"

export async function createApp(root){

    root.innerHTML = `
    <div class="overlay-root">
        <div class="aim-table" id="aim-table">
            <div class="overlay-text">
                Waiting Fire Event
            </div>
        </div>
    </div>
    `

    const table = root.querySelector("#aim-table")
    const overlayRoot = root.querySelector(".overlay-root")

    createImpactLayer(table)


    return {

        async show(data){

            console.log("SHOW OVERLAY", data)

            const summary = data.summary ?? {}

            overlayRoot.style.display = "flex"

            overlayRoot.innerHTML = `
        <div class="overlay-text">

            <h2>${data.playerName ?? "Unknown"}</h2>

            <div>
                Perfect: ${summary.PERFECT ?? 0}
            </div>

            <div>
                Good: ${summary.GOOD ?? 0}
            </div>

            <div>
                Bad: ${summary.BAD ?? 0}
            </div>

            <div>
                Miss: ${summary.MISS ?? 0}
            </div>

        </div>`

            console.log(
                "HTML AFTER:",
                table.innerHTML
            )

        },


        hide(){

            table.innerHTML = ""

        }

    }

}