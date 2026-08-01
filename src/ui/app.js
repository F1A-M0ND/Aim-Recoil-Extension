import { AIM_SIZE, fireSeries, getShotCount } from '../logic/calculator.js'
import { createImpactLayer, showImpact } from '../effect/impact.js'
import { sendFire } from "../obr/sync.js"
import { openAimOverlay } from "../obr/overlay-call.js"

const DEFAULT_SOUNDS = {
  Bullet: './assets/sounds/bullet.mp3',
  Handgun: './assets/sounds/handgun.mp3',
  Shotgun: './assets/sounds/shotgun.wav',
  SniperRifle: './assets/sounds/sniper-rifle.mp3',
  AutoRifle: './assets/sounds/auto-rifle.wav',
  GrenadeLauncher: './assets/sounds/grenade-launcher.mp3',
  RocketLauncher: './assets/sounds/rocket-launcher.mp3'
}

const CELL_LABEL = { PERFECT: 'P', GOOD: 'G', BAD: 'B', MISS: 'M' }
const cssResult = (result) => result.toLowerCase().replace(' ', '-')
const fmt = (value) => Number(value).toFixed(2)
const SHOT_COLORS = {
  0:"#ff6b6b",
  1:"#4dabf7",
  2:"#51cf66",
  3:"#845ef7",
  4:"#fcc419",
  5:"#ff922b",
  6:"#20c997",
  7:"#e599f7",
  8:"#74c0fc",
  9:"#adb5bd"
}

function getShotColor(number){
  return SHOT_COLORS[number % 10]
}

function fireDelay(rpm){
  if(Number(rpm)<=0) return Infinity

  return 60000 / Number(rpm)
}



function cellType(x, y) {
  if ((y === 6 || y === 7) && (x === 6 || x === 7)) return 'PERFECT'
  if (y >= 5 && y <= 8 && x >= 5 && x <= 8) return 'GOOD'
  if (y >= 3 && y <= 10 && x >= 3 && x <= 10) return 'BAD'
  return 'MISS'
}

function tableMarkup(shots = [], global = false) {
  let cells = ''

  for (let y = 1; y <= AIM_SIZE; y += 1) {
    for (let x = 1; x <= AIM_SIZE; x += 1) {
      const type = cellType(x, y)
      cells += `<span class="aim-cell ${cssResult(type)}">${CELL_LABEL[type]}</span>`
    }
  }
  const stacks = new Map()
  shots.forEach((shot) => {
    const key = `${shot.x.toFixed(4)}:${shot.y.toFixed(4)}`
    stacks.set(key, [...(stacks.get(key) || []), shot.number])
  })
  const markers = shots.map(({ x, y, result, number }) => {
    const left = ((Math.max(0, Math.min(13, x)) - .5) / AIM_SIZE) * 100
    const top = ((Math.max(0, Math.min(13, y)) - .5) / AIM_SIZE) * 100

    const stack = stacks.get(`${x.toFixed(4)}:${y.toFixed(4)}`) || []

    const overlap = stack.length > 1
        ? ` · overlaps #${stack.filter((item) => item !== number).join(', #')}`
        : ''

    const offset = stack.length > 1
        ? (stack.indexOf(number) - (stack.length - 1) / 2) * 5
        : 0

    return `
<button
 class="shot-marker"
 data-shot="${number}"
 style="
   left:${left}%;
   top:${top}%;
   --marker-colour:${getShotColor(number)};
   --stack-offset:${offset}px;
 "
 title="#${number}${overlap}"
>
 ${number}
</button>
`
  }).join('')
  return `<div class="aim-grid">${cells}</div><div class="aim-rings" aria-hidden="true"><i></i><i></i><i></i><b></b><em></em></div><div class="axis-label axis-x">X AXIS</div><div class="axis-label axis-y">Y AXIS</div><div class="marker-layer" aria-label="Shot markers">${markers}</div>`
}

export async function createApp(root, { isConnected }) {
  root.innerHTML = `
    <main class="app-shell">
      <header><p class="eyebrow">Owlbear Rodeo · Combat Planner</p><h1>Aim System</h1></header>
<section class="control-card sound-card">
  <label>
    <span>Fire Sound</span>

    <select id="fire-sound-select">
      <option value="Auto" selected>Auto</option>
      <option value="Bullet">Bullet</option>
      <option value="Handgun">Handgun</option>
      <option value="Shotgun">Shotgun</option>
      <option value="SniperRifle">SniperRifle</option>
      <option value="AutoRifle">AutoRifle</option>
      <option value="GrenadeLauncher">GrenadeLauncher</option>
      <option value="RocketLauncher">RocketLauncher</option>
      <option value="Upload">Upload Sound...</option>
    </select>

    <input 
      id="fire-sound-upload"
      type="file"
      accept="audio/*"
      hidden
    >
  </label>
</section>
      <form class="control-card" id="combat-form">
        <div class="mode-row"><label><input type="radio" name="mode" value="count" checked> Bullet Count</label><label><input type="radio" name="mode" value="time"> Timebase</label></div>
        <div class="field-grid">
          <label>Fire rate <input name="rpm" type="number" min="0" max="2400" value="600"><small>RPM (Timebase only)</small></label>
          <label>Accuracy Debuff <input name="debuff" type="number" min="0" step="0.01" value="0"><small>moves outward first</small></label>
          <label>Accuracy Buff <input name="buff" type="number" min="0" step="0.01" value="0"><small>then converges inward</small></label>
          <label data-mode="count">Rounds <input name="rounds" type="number" min="1" max="120" value="1"><small>shots to fire</small></label>
          <label data-mode="time" hidden>Time Trigger <input name="duration" type="number" min="0.1" max="60" step="0.1" value="1"><small>seconds held</small></label>
          <label>
  Weapon Recoil
  <input name="recoil" type="number" min="0" step="0.01" value="0">
  <small>weapon recoil value</small>
</label>
<label>
  Weapon Mastery
  <input name="mastery" type="number" min="0" step="0.01" value="0">
  <small>weapon mastery value</small>
</label>
<label class="full-width">
Strength
  <input name="str" type="number" min="0" step="1" value="0">
  <small>strength modify point</small>
</label>
</div>
        <button type="submit">Fire</button>
      </form>
<section class="aim-panel">
        <div class="aim-table" id="aim-table" role="img" aria-label="12 by 12 Aim Table with shot markers"></div>
      </section>

      <section class="result-card">
        <div class="result-heading">
          <h2>Aim Result</h2>
          <span id="shot-count">Ready to fire</span>
        </div>

        <p class="legend">
          <b class="perfect">P</b> Perfect
          <b class="good">G</b> Good
          <b class="bad">B</b> Bad
          <b class="miss">M</b> Miss
        </p>

        <section class="fire-result" id="fire-result" aria-live="polite">
          Press Fire to roll d12 for X and Y.
        </section>
        <p class="action-message" id="action-message"></p>
      </section>
    </main>`

  const form = root.querySelector('#combat-form')
  const table = root.querySelector('#aim-table')
  createImpactLayer(table)
  const resultPanel = root.querySelector('#fire-result')
  const shotCount = root.querySelector('#shot-count')
  const message = root.querySelector('#action-message')
  const fireSoundSelect = root.querySelector('#fire-sound-select')
  const fireSoundUpload = root.querySelector('#fire-sound-upload')
  let fireSound = null

  fireSoundSelect.addEventListener('change',(event)=>{

    const value = event.target.value

    if(value === 'Upload'){
      fireSoundUpload.click()
      return
    }

    if(value === 'Auto'){

      fireSound = new Audio(getAutoSound())
      fireSound.preload = "auto"
      fireSound.volume = 1

      return
    }

    fireSound = new Audio(DEFAULT_SOUNDS[value])

  })

  fireSoundUpload.addEventListener('change',(event)=>{

    const file = event.target.files[0]

    if(file){

      fireSound = new Audio(
          URL.createObjectURL(file)
      )

      fireSoundSelect.options[
          fireSoundSelect.selectedIndex
          ].text = `Upload: ${file.name}`

    }

  })

  function playFireSound(){

    if(!fireSound)
      return

    const sound = fireSound.cloneNode()

    sound.volume = fireSound.volume
    sound.currentTime = 0
    sound.preload = "auto"

    sound.play()
        .catch(error=>{
          console.log("sound error:", error)
        })

    sound.onended = () => {
      sound.remove()
    }

  }

  function getAutoSound() {

    const rpm = Number(values().rpm)
    const shotCount = getShotCount(values())

    // ยิงแค่ 1 นัด = Sniper เสมอ
    if (shotCount === 1) {
      return DEFAULT_SOUNDS.SniperRifle
    }


    // ไม่มี Fire Rate
    if (rpm === 0) {
      return DEFAULT_SOUNDS.Shotgun
    }


    // จำแนกตาม Fire Rate

    if (rpm >= 1 && rpm <= 19) {
      return DEFAULT_SOUNDS.RocketLauncher
    }


    if (rpm >= 20 && rpm <= 249) {
      return DEFAULT_SOUNDS.GrenadeLauncher
    }


    if (rpm >= 250 && rpm <= 599) {
      return DEFAULT_SOUNDS.Handgun
    }


    if (rpm >= 600) {
      return DEFAULT_SOUNDS.AutoRifle
    }


    return DEFAULT_SOUNDS.Bullet
  }

  let firedShots = []
  let visibleShots = []
  let globalShots = []
  let displayedShots = []
  const values = () => Object.fromEntries(new FormData(form))
  const setMode = () => {
    const timeMode = values().mode === 'time'
    form.querySelector('[data-mode="time"]').hidden = !timeMode
    form.querySelector('[data-mode="count"]').hidden = timeMode
    shotCount.textContent = `Will fire ${getShotCount(values())} shot${getShotCount(values()) === 1 ? '' : 's'}`
  }
  const renderSummary = (shots = firedShots) => {
    if (!shots.length) {
      resultPanel.textContent = 'Press Fire to roll d12 for X and Y.'
      return
    }

    resultPanel.innerHTML = shots.map(({ number, rolledX, rolledY, x, y, result }) =>
        `<button class="shot-output" data-shot="${number}" type="button">
      <b>#${number}</b> d12 (${rolledX}, ${rolledY}) → (${fmt(x)}, ${fmt(y)})
      <strong class="${cssResult(result)}">${result}</strong>
    </button>`
    ).join('')
  }
  const focusShot = (number) => {
    const shot = firedShots.find((item) => item.number === number)
    if (!shot) return
    table.classList.add('is-focused')
    table.querySelectorAll('.shot-marker').forEach((marker) => marker.classList.toggle('is-focused', Number(marker.dataset.shot) === number))
    resultPanel.querySelectorAll('.shot-output').forEach((row) => row.classList.toggle('is-focused', Number(row.dataset.shot) === number))
  }
  const clearFocus = () => {
    table.classList.remove('is-focused')
    table.querySelectorAll('.shot-marker').forEach((marker) => marker.classList.remove('is-focused'))
    resultPanel.querySelectorAll('.shot-output').forEach((row) => row.classList.remove('is-focused'))
  }
  const renderTable = (global = false) => {
    const oldImpactLayer = table.querySelector('.impact-layer')

    table.innerHTML = tableMarkup(
        global ? globalShots : visibleShots,
        global
    )

    if(oldImpactLayer){
      table.appendChild(oldImpactLayer)
    }

    table.querySelectorAll('.shot-marker').forEach((marker)=>{
      const number = Number(marker.dataset.shot)
      marker.addEventListener('mouseenter',()=>focusShot(number))
      marker.addEventListener('focus',()=>focusShot(number))
    })
  }
  table.addEventListener('mouseleave', clearFocus)
  resultPanel.addEventListener('mouseover', (event) => {
    const row = event.target.closest('.shot-output')
    if (row) focusShot(Number(row.dataset.shot))
  })
  resultPanel.addEventListener('focusin', (event) => {
    const row = event.target.closest('.shot-output')
    if (row) focusShot(Number(row.dataset.shot))
  })
  resultPanel.addEventListener('mouseleave', clearFocus)
  form.addEventListener('change', setMode)
  form.addEventListener('input', setMode)
  let isFiring = false

  async function playFireAnimation(
      shots,
      rpm,
      global = false
  ){

    if(rpm <= 0){

      visibleShots.push(...shots)
      displayedShots.push(...shots)

      renderTable(global)
      if (!global) {
        renderSummary(displayedShots)
      }

      if(fireSoundSelect.value === "Auto"){
        fireSound = new Audio(getAutoSound())
        fireSound.volume = 1
      }

      playFireSound()

      for(const shot of shots){
        showImpact(shot.x, shot.y)
      }

      return
    }

    const delayTime = fireDelay(rpm)

    for(const shot of shots){

      if(global){
        globalShots.push(shot)
      }else{
        visibleShots.push(shot)
        displayedShots.push(shot)
      }

      renderTable(global)

      if(!global){
        renderSummary(displayedShots)
      }

      if(fireSoundSelect.value === "Auto"){
        fireSound = new Audio(getAutoSound())
        fireSound.volume = 1
      }

      playFireSound()
      showImpact(shot.x, shot.y)

      await new Promise(r => setTimeout(r, delayTime))
    }
  }


  form.addEventListener('submit', async (event) => {

    event.preventDefault()

    if (isFiring) return

    isFiring = true

    const fireButton = form.querySelector('button[type="submit"]')
    fireButton.disabled = true

    firedShots = []
    visibleShots = []
    displayedShots = []
    renderTable()

    firedShots = fireSeries(values())

    table.classList.add("is-firing")

    await new Promise(r => setTimeout(r, 1000))

    const rpm = Number(values().rpm)

    await playFireAnimation(
        firedShots,
        rpm,
        false
    )

    try {
      await sendFire({
        shots: firedShots,
        rpm: Number(values().rpm)
      })

    } catch(error){

      console.log("sync error:", error)

    }

    await new Promise(r => setTimeout(r,1000))

    table.style.transition = "filter 1s ease"
    table.classList.remove("is-firing")

    await new Promise(r => setTimeout(r,500))

    table.style.transition = ""

    const summary = firedShots.reduce(
        (counts,{result})=>({
          ...counts,
          [result]:(counts[result]||0)+1
        }),
        {}
    )

    renderSummary()

    shotCount.textContent =
        `${firedShots.length} shot${firedShots.length===1?"":"s"} fired`

    message.textContent =
        Object.entries(summary)
            .map(([name,count])=>`${count} ${name}`)
            .join(" · ")

    isFiring = false
    fireButton.disabled = false
  })
  renderTable()
  setMode()
  return {
    playRemoteFire: async ({shots,rpm}) => {

      globalShots = []
      visibleShots = []
      firedShots = shots

      table.classList.add("is-firing")

      await playFireAnimation(shots,rpm,true)

      await new Promise(r=>setTimeout(r,1000))

      table.classList.remove("is-firing")
    }
  }
}
