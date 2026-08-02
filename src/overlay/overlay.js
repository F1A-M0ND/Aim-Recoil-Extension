export async function createApp(root){

    root.innerHTML = `
        <div
            style="
                width:400px;
                height:400px;
                background:red;
                color:white;
                font-size:40px;
                display:flex;
                align-items:center;
                justify-content:center;
            "
        >
            OVERLAY
        </div>
    `

    console.log("Overlay Loaded")
}