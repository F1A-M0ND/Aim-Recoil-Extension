import { defineConfig } from "vite"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


export default defineConfig({

    base:"/Aim-Recoil-Extension/",

    build:{
        rollupOptions:{
            input:{

                main:path.resolve(
                    __dirname,
                    "index.html"
                ),

                overlay:path.resolve(
                    __dirname,
                    "overlay.html"
                )

            }
        }
    },


    server:{
        cors:{
            origin:"https://www.owlbear.rodeo"
        }
    }

})