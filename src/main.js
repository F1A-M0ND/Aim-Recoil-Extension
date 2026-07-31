import './style.css'
import { isObrAvailable, OBR } from './obr/client.js'
import { createApp } from './ui/app.js'

const root = document.querySelector('#app')

const start = () =>
    createApp(root, {
        isConnected: isObrAvailable()
    })

if (isObrAvailable()) {

    OBR.onReady(() => {

        start()

    })

} else {

    start()

}