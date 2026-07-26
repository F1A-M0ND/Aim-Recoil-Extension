import { OBR } from './client.js'

const METADATA_KEY = 'com.aim-recoil-extension/overlay'

/** Project valid Aim Table results around the centre of the current board view. */
export async function projectAimOverlay(shots) {
  if (!OBR.isAvailable) throw new Error('Open this extension inside Owlbear Rodeo to project onto the board.')
  const centre = await OBR.viewport.getPosition()
  const validShots = shots.filter(({ result }) => result !== 'CRITICAL MISS')
  const items = validShots.map(({ number, x, y, result }) => OBR.buildShape()
    .name(`Aim shot ${number}: ${result}`)
    .position({ x: centre.x + (x - 6.5) * 14, y: centre.y + (y - 6.5) * 14 })
    .width(9).height(9).shapeType('CIRCLE')
    .fillColor(result === 'PERFECT' ? '#6ff0a4' : result === 'GOOD' ? '#73dfff' : '#ffb55c')
    .fillOpacity(0.9).strokeColor('#ffffff').strokeOpacity(0.9).strokeWidth(1)
    .disableHit(true).metadata({ [METADATA_KEY]: { kind: 'shot' } }).build())
  await OBR.scene.items.addItems(items)
  return items.length
}

export async function clearAimOverlays() {
  if (!OBR.isAvailable) throw new Error('Open this extension inside Owlbear Rodeo to clear board markers.')
  const items = await OBR.scene.items.getItems()
  const ids = items.filter((item) => item.metadata?.[METADATA_KEY]).map((item) => item.id)
  if (ids.length) await OBR.scene.items.deleteItems(ids)
  return ids.length
}
