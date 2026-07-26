import './style.css'
import { isObrAvailable, OBR } from './obr/client.js'
import { createApp } from './ui/app.js'

const root = document.querySelector('#app')
const start = () => createApp(root, { isConnected: isObrAvailable() })

// The board API is only safe to call after Owlbear has completed its handshake.
if (isObrAvailable()) OBR.onReady(start)
else start()
