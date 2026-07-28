import { defineConfig } from "vite";

export default defineConfig({
    base: "/Aim-Recoil-Extension/",
    server: {
        cors: {
            origin: "https://www.owlbear.rodeo",
        },
    },
});