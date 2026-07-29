// impact.js

const AIM_SIZE = 12

let layer = null

export function createImpactLayer(parent) {

    parent.style.position = 'relative'

    layer = document.createElement('div')
    layer.className = 'impact-layer'

    Object.assign(layer.style,{
        position:'absolute',
        inset:'0',
        pointerEvents:'none',
        overflow:'hidden',
        zIndex:'999'
    })

    parent.appendChild(layer)

    return layer
}
export function showImpact(x, y, {
    duration = 180,
    size = 110,
    color = '#ffe95b'
} = {}) {
    if (!layer) {
        console.warn('Impact layer not ready')
        return
    }

    const impact = document.createElement('div')
    impact.className = 'impact-circle'

    const left = ((x - 0.5) / AIM_SIZE) * 100
    const top = ((y - 0.5) / AIM_SIZE) * 100

    Object.assign(impact.style, {
        position: 'absolute',
        left: `${left}%`,
        top: `${top}%`,
        width: `${size}px`,
        height: `${size}px`,
        background: color,
        borderRadius: '50%',
        transform: 'translate(-50%, -50%) scale(1)',
        opacity: '1',
        boxSizing: 'border-box',
        transition: `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`
    })

    layer.appendChild(impact)

    impact.getBoundingClientRect()

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            impact.style.transform =
                'translate(-50%, -50%) scale(0.08)'
            impact.style.opacity = '0'
        })
    })

    impact.addEventListener(
        'transitionend',
        () => impact.remove(),
        { once: true }
    )
}