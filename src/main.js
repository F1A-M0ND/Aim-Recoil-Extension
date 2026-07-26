import './style.css'
import { isObrAvailable } from './obr/client.js'
import { createApp } from './ui/app.js'

const root = document.querySelector('#app')
const isConnected = isObrAvailable()

createApp(root, { isConnected })
