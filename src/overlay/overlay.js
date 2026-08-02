export async function createApp(root){

    root.innerHTML = `
        <div id="overlay-root"></div>
    `

    const overlay = root.querySelector("#overlay-root")

    return {

        show(data){

            console.log("SHOW", data)

        },

        hide(){

            console.log("HIDE")

        }

    }

}