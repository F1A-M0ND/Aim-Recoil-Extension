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

        // เตรียม Promise รอการปิดก่อน
        const closed = overlay.waitUntilClosed()

        await showPopover()

        await overlay.show(item)

        // รอจน overlay ปิดจริง
        await closed

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