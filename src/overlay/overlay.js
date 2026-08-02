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

    createImpactLayer(table)


    return {

        async show(data){

            console.log("OVERLAY FIRE:", data)

            table.innerHTML = `
                <div class="overlay-text">
                    FIRE RECEIVED
                    <br>
                    ${data.shots.length} shots
                </div>
            `

            for(const shot of data.shots){

                showImpact(
                    shot.x,
                    shot.y
                )

            }

        },


        hide(){

            table.innerHTML = ""

        }

    }

}