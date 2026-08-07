import {
    showPopover,
    hidePopover
} from "../obr/popover.js"

export function createOverlayQueue(overlay){

    const queue = []
    let running = false

    async function next(){

        if(running)
            return

        const item = queue.shift()

        if(!item)
            return

        running = true

        await showPopover()

        await overlay.show(item)

        await overlay.waitUntilClosed()

        await hidePopover()

        running = false

        next()

    }

    return {

        enqueue(data){

            queue.push(data)

            next()

        }

    }

}