import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({

    base:"/Aim-Recoil-Extension/",

    build:{
        rollupOptions:{
            input:{
                main:resolve(__dirname,"index.html"),
                overlay:resolve(__dirname,"overlay.html")
            }
        }
    },

    server:{
        cors:{
            origin:"https://www.owlbear.rodeo"
        }
    }

})