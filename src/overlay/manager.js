let overlayApi = null

export function registerOverlay(api){
    overlayApi = api
}

export function showOverlay(data){
    if(!overlayApi) return

    overlayApi.show(data)
}

export function hideOverlay(){

    if(!overlayApi) return

    overlayApi.hide()
}