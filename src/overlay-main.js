import "./overlay/overlay.css";
import { OBR, isObrAvailable } from "./obr/client.js";
import { createApp } from "./overlay/overlay.js";


const root = document.querySelector("#app");


function start(){

    createApp(root);

}


if(isObrAvailable()){

    OBR.onReady(()=>{
        start();
    });

}else{

    start();

}