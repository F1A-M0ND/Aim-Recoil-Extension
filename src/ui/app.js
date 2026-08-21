import { AIM_SIZE, fireSeries, getShotCount } from '../logic/calculator.js'
import { createImpactLayer, showImpact } from '../effect/impact.js'
import { sendFire } from '../obr/sync.js'

let audioUnlocked = false
const SETTINGS_KEY = 'aim-recoil.settings'
const DEFAULT_SOUNDS = {
  Bullet: './assets/sounds/bullet.mp3', Handgun: './assets/sounds/handgun.mp3', Shotgun: './assets/sounds/shotgun.wav',
  SniperRifle: './assets/sounds/sniper-rifle.mp3', AutoRifle: './assets/sounds/auto-rifle.wav',
  GrenadeLauncher: './assets/sounds/grenade-launcher.mp3', RocketLauncher: './assets/sounds/rocket-launcher.mp3'
}
const SOUND_CACHE = {}
const COLORS = ['#ff6b6b', '#4dabf7', '#51cf66', '#845ef7', '#fcc419', '#ff922b', '#20c997', '#e599f7', '#74c0fc', '#adb5bd']
const LABELS = { PERFECT: 'P', GOOD: 'G', BAD: 'B', MISS: 'M' }
const RESULT_ORDER = ['PERFECT', 'GOOD', 'BAD', 'MISS', 'CRITICAL MISS']

const cssResult = result => result.toLowerCase().replace(' ', '-')
const fmt = value => Number(value).toFixed(2)
const fireDelay = rpm => Number(rpm) <= 0 ? Infinity : 60000 / Number(rpm)

function readSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
  } catch {
    return {}
  }
}

function preloadSounds() {
  Object.entries(DEFAULT_SOUNDS).forEach(([name, src]) => {
    const sound = new Audio(src)
    sound.preload = 'auto'
    sound.load()
    SOUND_CACHE[name] = sound
  })
}

function visibleShots(shots, startNumber = 0) {
  let markerNumber = startNumber
  return shots.flatMap(shot => shot.subBullets
    ? shot.subBullets.map((bullet, index) => ({ ...bullet, number: ++markerNumber, round: shot.number, subBullet: index + 1 }))
    : [{ ...shot, number: ++markerNumber, round: shot.number }])
}

function countResults(items = []) {
  return items.reduce((counts, { result }) => {
    counts[result] = (counts[result] || 0) + 1
    return counts
  }, {})
}

function formatResultCounts(counts) {
  return RESULT_ORDER
    .filter(name => counts[name] > 0)
    .map(name => `${counts[name]} ${name.toLowerCase()}`)
    .join(' · ')
}

function roundColor(roundNumber) {
  return COLORS[(Math.max(1, Number(roundNumber)) - 1) % COLORS.length]
}

function groupMarkersByRound(markers = []) {
  const rounds = new Map()

  markers.forEach(marker => {
    const roundNumber = Number(marker.round ?? marker.number)
    const group = rounds.get(roundNumber) ?? {
      number: roundNumber,
      x: marker.x,
      y: marker.y,
      rolledX: marker.rolledX,
      rolledY: marker.rolledY,
      result: marker.result,
      subBullets: []
    }

    if (marker.subBullet == null) {
      group.x = marker.x
      group.y = marker.y
      group.rolledX = marker.rolledX
      group.rolledY = marker.rolledY
      group.result = marker.result
    } else {
      group.subBullets.push(marker)
    }

    rounds.set(roundNumber, group)
  })

  return [...rounds.values()].sort((a, b) => a.number - b.number).map(group => ({
    ...group,
    subBullets: group.subBullets.sort((a, b) => Number(a.subBullet) - Number(b.subBullet))
  }))
}

function getCriticalMissArrow(x, y) {
  const horizontal = x < 0.5 ? 'left' : x > AIM_SIZE + 0.5 ? 'right' : ''
  const vertical = y < 0.5 ? 'up' : y > AIM_SIZE + 0.5 ? 'down' : ''

  if (horizontal && vertical) {
    if (horizontal === 'left' && vertical === 'up') return '↖'
    if (horizontal === 'right' && vertical === 'up') return '↗'
    if (horizontal === 'left' && vertical === 'down') return '↙'
    if (horizontal === 'right' && vertical === 'down') return '↘'
  }

  if (horizontal === 'left') return '←'
  if (horizontal === 'right') return '→'
  if (vertical === 'up') return '↑'
  if (vertical === 'down') return '↓'
  return ''
}

function getCriticalMissDirection(x, y) {
  const horizontal = x < 0.5 ? 'left' : x > AIM_SIZE + 0.5 ? 'right' : ''
  const vertical = y < 0.5 ? 'up' : y > AIM_SIZE + 0.5 ? 'down' : ''

  if (horizontal && vertical) return `${vertical}-${horizontal}`
  if (horizontal) return horizontal
  if (vertical) return vertical
  return 'right'
}

function describeShotTarget(element) {
  return {
    round: Number(element.dataset.round),
    subBullet: element.dataset.subbullet ? Number(element.dataset.subbullet) : null,
    focusTarget: element.dataset.focusTarget || 'round'
  }
}

function targetMatchesElement(target, element) {
  const round = Number(element.dataset.round)
  if (round !== target.round) return false
  if (target.focusTarget === 'round') return true
  if (target.focusTarget === 'critical-miss') {
    const elementSubBullet = element.dataset.subbullet ? Number(element.dataset.subbullet) : null
    return element.dataset.focusTarget === 'critical-miss' && elementSubBullet === target.subBullet
  }
  if (target.subBullet == null) return true
  const focusTarget = element.dataset.focusTarget
  if (focusTarget === 'round') return true
  return Number(element.dataset.subbullet) === target.subBullet
}

function shotMarkerMarkup(marker) {
  const markerColour = roundColor(marker.round)
  if (marker.result === 'CRITICAL MISS') {
    const direction = marker.criticalMissDirection || getCriticalMissDirection(marker.x, marker.y)
    const left = marker.x < 0.5 ? 0 : marker.x > AIM_SIZE + 0.5 ? 100 : ((Math.max(0.5, Math.min(AIM_SIZE + 0.5, marker.x)) - 0.5) / AIM_SIZE) * 100
    const top = marker.y < 0.5 ? 0 : marker.y > AIM_SIZE + 0.5 ? 100 : ((Math.max(0.5, Math.min(AIM_SIZE + 0.5, marker.y)) - 0.5) / AIM_SIZE) * 100
    const subBulletAttr = marker.subBullet ? `data-subbullet="${marker.subBullet}"` : ''
    return `<button type="button" class="shot-critical-miss is-${direction}" data-shot="${marker.number}" data-round="${marker.round}" ${subBulletAttr} data-focus-target="critical-miss" style="left:clamp(9px, ${left}%, calc(100% - 9px));top:clamp(9px, ${top}%, calc(100% - 9px));--marker-colour:${markerColour}"><span class="shot-critical-miss-dot"></span><span class="shot-critical-miss-triangle"></span></button>`
  }
  const focusAttrs = marker.subBullet
    ? `data-round="${marker.round}" data-subbullet="${marker.subBullet}" data-focus-target="subbullet"`
    : `data-round="${marker.round}" data-focus-target="round"`
  const left = ((Math.max(0, Math.min(13, marker.x)) - .5) / AIM_SIZE) * 100
  const top = ((Math.max(0, Math.min(13, marker.y)) - .5) / AIM_SIZE) * 100
  return `<button type="button" class="shot-marker" data-shot="${marker.number}" ${focusAttrs} style="left:${left}%;top:${top}%;--marker-colour:${markerColour}"><span class="shot-marker-number">${marker.number}</span></button>`
}

function renderShotSummary(shot) {
  const roundLabel = `Round ${shot.number}`
  if (shot.subBullets?.length) {
    const counts = countResults(shot.subBullets)
    const detail = formatResultCounts(counts)
    const roll = shot.rolledX ? `d12 (${shot.rolledX}, ${shot.rolledY}) → ` : ''
    return `
      <details class="shot-round" data-round="${shot.number}" data-focus-target="round" style="--marker-colour:${roundColor(shot.number)}">
        <summary class="shot-round-summary">
          <span class="shot-round-title">${roundLabel}</span>
          <span class="shot-round-meta">${roll}(${fmt(shot.x)}, ${fmt(shot.y)})${detail ? ` · ${detail}` : ''}</span>
        </summary>
        <div class="shot-round-details">
          ${shot.subBullets.map(bullet => `
            <button
              type="button"
              class="shot-subshot ${bullet.result === 'CRITICAL MISS' ? 'is-critical-miss' : ''}"
              data-round="${shot.number}"
              data-subbullet="${bullet.number}"
              data-focus-target="${bullet.result === 'CRITICAL MISS' ? 'critical-miss' : 'subbullet'}"
              style="--marker-colour:${roundColor(shot.number)}"
            >
              <span class="shot-subshot-title">Pellet ${bullet.number}</span>
              <span class="shot-subshot-meta">
                (${fmt(bullet.x)}, ${fmt(bullet.y)})
                ${bullet.result === 'CRITICAL MISS' ? `<strong class="critical-miss"><span class="critical-miss-badge">${bullet.criticalMissArrow || getCriticalMissArrow(bullet.x, bullet.y)}</span> critical miss</strong>` : `<strong class="${cssResult(bullet.result)}">${bullet.result}</strong>`}
              </span>
            </button>
          `).join('')}
        </div>
      </details>
    `
  }

  const roll = shot.rolledX ? `d12 (${shot.rolledX}, ${shot.rolledY}) → ` : ''
  return `
    <button
      type="button"
      class="shot-round shot-round--single"
    data-round="${shot.number}"
    data-focus-target="round"
    style="--marker-colour:${roundColor(shot.number)}"
  >
      <span class="shot-round-title">${roundLabel}</span>
      <span class="shot-round-meta">${roll}(${fmt(shot.x)}, ${fmt(shot.y)}) ${shot.result === 'CRITICAL MISS' ? `<strong class="critical-miss"><span class="critical-miss-badge">${shot.criticalMissArrow || getCriticalMissArrow(shot.x, shot.y)}</span> critical miss</strong>` : `<strong class="${cssResult(shot.result)}">${shot.result}</strong>`}</span>
    </button>
  `
}

function cellType(x, y) {
  if ((y === 6 || y === 7) && (x === 6 || x === 7)) return 'PERFECT'
  if (y >= 5 && y <= 8 && x >= 5 && x <= 8) return 'GOOD'
  if (y >= 3 && y <= 10 && x >= 3 && x <= 10) return 'BAD'
  return 'MISS'
}

function tableMarkup(shots = []) {
  let cells = ''
  for (let y = 1; y <= AIM_SIZE; y += 1) for (let x = 1; x <= AIM_SIZE; x += 1) {
    const result = cellType(x, y)
    cells += `<span class="aim-cell ${cssResult(result)}">${LABELS[result]}</span>`
  }
  const markers = shots.map(shotMarkerMarkup).join('')
  return `<div class="aim-grid">${cells}</div><div class="aim-rings"><i></i><i></i><i></i><b></b><em></em></div><div class="marker-layer">${markers}</div>`
}

export async function createApp(root, { onAudioStatus = () => {} } = {}) {
  const saved = readSettings()
  const setting = (name, fallback) => saved[name] ?? fallback
  let overlayDisplay = setting('overlayDisplay', true)
  let enterToFire = setting('enterToFire', true)
  let activePage = 'fire'

  root.innerHTML = `
    <div id="audio-unlock-overlay" role="button" tabindex="0" aria-label="Click to enable sound">
      Click anywhere to enable sound
      <small id="audio-unlock-status">Required before fire sounds can play.</small>
    </div>
    <form class="app-shell" id="combat-form">
      <header><p class="eyebrow">Owlbear Rodeo · Combat Planner</p><h1>Aim System</h1></header>
      <aside class="sidebar is-open">
        <button class="menu-toggle" type="button" aria-expanded="true">&#9776;</button>
        <nav>
          <button class="nav-item is-active" type="button" data-page="fire">&#x1698F; <span>Fire</span></button>
          <button class="nav-item" type="button" data-page="weapon">&#x2694; <span>Weapon</span></button>
          <button class="nav-item" type="button" data-page="misc">&#x2699; <span>Misc</span></button>
        </nav>
      </aside>
      <div class="page-content">
        <section class="page is-active" data-page-panel="fire">
          <section class="aim-panel"><div class="aim-table" id="aim-table"></div></section>
          <section class="result-card">
            <div class="result-heading"><h2>Fire Result</h2><div class="fire-tools"><span id="shot-count">Ready to fire</span><button id="overlay-display-toggle" class="icon-button" type="button" aria-pressed="${overlayDisplay}" title="Overlay Display"></button></div></div>
            <p class="legend"><b class="perfect">P</b> Perfect <b class="good">G</b> Good <b class="bad">B</b> Bad <b class="miss">M</b> Miss</p>
            <section class="fire-result" id="fire-result">Press Fire to roll d12 for X and Y.</section><p class="action-message" id="action-message"></p>
          </section>
          <button class="fire-button" type="submit">Fire</button>
        </section>
        <section class="page" data-page-panel="weapon">
          <section class="control-card"><h2>Weapon Setup</h2>
            <div class="mode-row"><label><input type="radio" name="mode" value="count" ${setting('mode', 'count') === 'count' ? 'checked' : ''}> Bullet Count</label><label><input type="radio" name="mode" value="time" ${setting('mode', 'count') === 'time' ? 'checked' : ''}> Timebase</label></div>
            <div class="field-grid">
              <label>Fire Rate <input name="rpm" type="number" min="0" max="2400" value="${setting('rpm', 600)}"><small>RPM</small></label>
              <label data-mode="count">Rounds <input name="rounds" type="number" min="1" max="120" value="${setting('rounds', 1)}"><small>main shots to fire</small></label>
              <label data-mode="time" hidden>Time Trigger <input name="duration" type="number" min="0.1" max="60" step="0.1" value="${setting('duration', 1)}"></label>
              <label class="checkbox-field" data-mode="count"><input name="shotgun" type="checkbox" ${setting('shotgun', false) ? 'checked' : ''}> Shotgun</label>
              <label data-shotgun class="shotgun-field">Radius <input name="shotgunRadius" type="number" min="0" step="0.1" value="${setting('shotgunRadius', 2)}"></label>
              <label data-shotgun class="shotgun-field">Sub-bullet <input name="shotgunSubBullet" type="number" min="1" max="120" step="1" value="${setting('shotgunSubBullet', 8)}"></label>
              <label>Accuracy Debuff <input name="debuff" type="number" min="0" step="0.01" value="${setting('debuff', 0)}"></label><label>Accuracy Buff <input name="buff" type="number" min="0" step="0.01" value="${setting('buff', 0)}"></label>
              <label>Weapon Recoil <input name="recoil" type="number" min="0" step="0.01" value="${setting('recoil', 0)}"></label><label>Weapon Mastery <input name="mastery" type="number" min="0" step="0.01" value="${setting('mastery', 0)}"></label><label>Strength <input name="str" type="number" min="0" step="1" value="${setting('str', 0)}"></label>
              <label>Fire Sound <select name="fireSound"><option value="Auto">Auto</option>${Object.keys(DEFAULT_SOUNDS).map(name => `<option value="${name}" ${setting('fireSound', 'Auto') === name ? 'selected' : ''}>${name}</option>`).join('')}<option value="Upload">Upload Sound…</option></select><input id="fire-sound-upload" type="file" accept="audio/*" hidden></label>
            </div>
          </section>
        </section>
        <section class="page" data-page-panel="misc"><section class="control-card"><h2>Table</h2><div class="field-grid"><label>Table Size <input name="tableSize" type="number" min="220" max="900" value="${setting('tableSize', 360)}"></label><label>Perfect color <input name="perfectColor" type="color" value="${setting('perfectColor', '#fff896')}"></label><label>Good color <input name="goodColor" type="color" value="${setting('goodColor', '#f9d36b')}"></label><label>Bad color <input name="badColor" type="color" value="${setting('badColor', '#f89d59')}"></label><label>Miss color <input name="missColor" type="color" value="${setting('missColor', '#f1635c')}"></label></div><h2 class="utility-heading">Fix / Utility</h2><label class="checkbox-field"><input name="enterToFire" type="checkbox" ${enterToFire ? 'checked' : ''}> Enter on Weapon jumps to Fire and shoots</label><button id="reload-sound" class="utility-button" type="button">Reload Sound</button><small>Reloads the cached sound resources without changing your selected Fire Sound.</small></section></section>
      </div>
    </form>`

  preloadSounds()
  const form = root.querySelector('#combat-form')
  const table = root.querySelector('#aim-table')
  const resultPanel = root.querySelector('#fire-result')
  const shotCount = root.querySelector('#shot-count')
  const message = root.querySelector('#action-message')
  const overlayToggle = root.querySelector('#overlay-display-toggle')
  let fireSound = SOUND_CACHE.Bullet.cloneNode()
  let firedShots = [], visibleMarkers = [], displayedMarkers = [], isFiring = false
  let focusTarget = null
  createImpactLayer(table)

  const values = () => ({ ...Object.fromEntries(new FormData(form)), shotgun: !form.elements.shotgun.disabled && form.elements.shotgun.checked })
  const save = () => localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...Object.fromEntries(new FormData(form)), shotgun: form.elements.shotgun.checked, overlayDisplay, enterToFire: form.elements.enterToFire.checked }))
  const updateOverlayToggle = () => { overlayToggle.setAttribute('aria-pressed', String(overlayDisplay)); overlayToggle.textContent = overlayDisplay ? '👁' : '⊘'; overlayToggle.title = `Overlay Display: ${overlayDisplay ? 'On' : 'Off'}` }
  const applyTable = () => { const v = values(); table.style.width = `${Math.max(220, Math.min(900, Number(v.tableSize) || 360))}px`; table.style.setProperty('--perfect-colour', v.perfectColor); table.style.setProperty('--good-colour', v.goodColor); table.style.setProperty('--bad-colour', v.badColor); table.style.setProperty('--miss-colour', v.missColor) }
  const showPage = pageName => {
    activePage = pageName
    root.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('is-active', item.dataset.page === pageName))
    root.querySelectorAll('[data-page-panel]').forEach(panel => panel.classList.toggle('is-active', panel.dataset.pagePanel === pageName))
  }
  const applyFocus = () => {
    const target = focusTarget
    const markers = table.querySelectorAll('.shot-marker')
    const resultItems = resultPanel.querySelectorAll('[data-focus-target]')
    const allInteractive = [...markers, ...resultItems]

    if (!target) {
      allInteractive.forEach(el => { el.classList.remove('is-focused', 'is-muted') })
      table.classList.remove('has-focus')
      resultPanel.classList.remove('has-focus')
      return
    }

    let matched = false
    allInteractive.forEach(el => {
      const hit = targetMatchesElement(target, el)
      el.classList.toggle('is-focused', hit)
      el.classList.toggle('is-muted', !hit)
      if (hit) matched = true
    })

    if (!matched) {
      focusTarget = null
      applyFocus()
      return
    }

    table.classList.toggle('has-focus', true)
    resultPanel.classList.toggle('has-focus', true)
  }
  const setFocus = target => { focusTarget = target ? describeShotTarget(target) : null; applyFocus() }
  const clearFocus = () => setFocus(null)
  const setMode = () => {
    const time = form.elements.mode.value === 'time'
    form.elements.shotgun.disabled = time
    const v = values()
    form.querySelectorAll('[data-mode="time"]').forEach(el => { el.hidden = !time })
    form.querySelectorAll('[data-mode="count"]').forEach(el => { el.hidden = time })
    form.querySelectorAll('[data-shotgun]').forEach(el => {
      el.hidden = time
      el.classList.toggle('is-active', !time && v.shotgun)
    })
    const count = getShotCount(v)
    shotCount.textContent = `Will fire ${count} shot${count === 1 ? '' : 's'}`
  }
  const renderTable = () => { const layer = table.querySelector('.impact-layer'); table.innerHTML = tableMarkup(visibleMarkers); if (layer) table.appendChild(layer); applyFocus() }
  const renderSummary = () => {
    if (!displayedMarkers.length) {
      resultPanel.innerHTML = 'Press Fire to roll d12 for X and Y.'
      applyFocus()
      return
    }

    resultPanel.innerHTML = firedShots.filter(shot => displayedMarkers.some(marker => marker.round === shot.number)).map(renderShotSummary).join('')
    applyFocus()
  }
  const autoSound = () => { const rpm = Number(values().rpm), count = getShotCount(values()); if (count === 1) return DEFAULT_SOUNDS.SniperRifle; if (rpm === 0) return DEFAULT_SOUNDS.Shotgun; if (rpm < 20) return DEFAULT_SOUNDS.RocketLauncher; if (rpm < 250) return DEFAULT_SOUNDS.GrenadeLauncher; if (rpm < 600) return DEFAULT_SOUNDS.Handgun; return DEFAULT_SOUNDS.AutoRifle }
  const playSound = () => { const selected = form.elements.fireSound.value, sound = selected === 'Auto' ? new Audio(autoSound()) : fireSound.cloneNode(); sound.volume = 1; sound.currentTime = 0; sound.play().catch(() => {}) }
  async function unlockAudio(force = false) {
    if (audioUnlocked && !force) return true
    const results = await Promise.all(Object.values(SOUND_CACHE).map(sound => {
      const unlockSound = sound.cloneNode()
      unlockSound.volume = 0
      unlockSound.currentTime = 0
      return unlockSound.play().then(() => {
        unlockSound.pause()
        unlockSound.currentTime = 0
        return true
      }).catch(() => false)
    }))
    if (!results.some(Boolean)) return false
      audioUnlocked = true
      Promise.resolve(onAudioStatus(true)).catch(error => console.log('audio status error:', error))
      return true
  }
  async function playFireAnimation(shots, rpm) { for (const shot of shots) { const markers = visibleShots([shot], visibleMarkers.length); visibleMarkers.push(...markers); displayedMarkers.push(...markers); renderTable(); renderSummary(); playSound(); markers.forEach(marker => showImpact(marker.x, marker.y)); if (rpm > 0) await new Promise(resolve => setTimeout(resolve, fireDelay(rpm))) } }

  root.querySelector('.menu-toggle').addEventListener('click', event => { const sidebar = root.querySelector('.sidebar'); sidebar.classList.toggle('is-open'); event.currentTarget.setAttribute('aria-expanded', String(sidebar.classList.contains('is-open'))) })
  root.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => showPage(button.dataset.page)))
  overlayToggle.addEventListener('click', () => { overlayDisplay = !overlayDisplay; updateOverlayToggle(); save() })
  form.addEventListener('input', () => { enterToFire = form.elements.enterToFire.checked; save(); setMode(); applyTable() })
  form.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return
    if (!enterToFire) return
    if (activePage !== 'weapon') return
    if (event.target.closest('button, select, textarea')) return
    event.preventDefault()
    showPage('fire')
    form.requestSubmit()
  })
  form.addEventListener('change', event => { if (event.target.name === 'fireSound') { if (event.target.value === 'Upload') root.querySelector('#fire-sound-upload').click(); else fireSound = new Audio(DEFAULT_SOUNDS[event.target.value] || DEFAULT_SOUNDS.Bullet) } enterToFire = form.elements.enterToFire.checked; save(); setMode(); applyTable() })
  root.querySelector('#fire-sound-upload').addEventListener('change', event => { if (event.target.files[0]) fireSound = new Audio(URL.createObjectURL(event.target.files[0])) })
  root.querySelector('#reload-sound').addEventListener('click', async event => { event.currentTarget.disabled = true; preloadSounds(); const selected = form.elements.fireSound.value; if (DEFAULT_SOUNDS[selected]) fireSound = new Audio(DEFAULT_SOUNDS[selected]); await unlockAudio(true); event.currentTarget.disabled = false })
  const audioOverlay = root.querySelector('#audio-unlock-overlay')
  const audioUnlockStatus = root.querySelector('#audio-unlock-status')
  const setFocusFromElement = element => setFocus(describeShotTarget(element))
  const tryUnlockAudio = async () => {
    audioUnlockStatus.textContent = 'Enabling sound...'
    if (await unlockAudio()) {
      audioOverlay.remove()
      return
    }
    audioUnlockStatus.textContent = 'Sound could not start. Click again.'
  }
  audioOverlay.addEventListener('click', event => {
    if (event.target.closest('#audio-unlock-overlay')) tryUnlockAudio()
  })
  audioOverlay.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      tryUnlockAudio()
    }
  })
  table.addEventListener('pointerover', event => {
    const marker = event.target.closest('.shot-marker')
    const critical = event.target.closest('.shot-critical-miss')
    if (critical) {
      setFocusFromElement(critical)
      return
    }
    if (!marker) return
    setFocusFromElement(marker)
  })
  table.addEventListener('pointerout', event => {
    if (event.relatedTarget && table.contains(event.relatedTarget)) return
    clearFocus()
  })
  table.addEventListener('focusin', event => {
    const marker = event.target.closest('.shot-marker')
    const critical = event.target.closest('.shot-critical-miss')
    if (critical) {
      setFocusFromElement(critical)
      return
    }
    if (!marker) return
    setFocusFromElement(marker)
  })
  table.addEventListener('focusout', event => {
    if (event.relatedTarget && table.contains(event.relatedTarget)) return
    clearFocus()
  })
  resultPanel.addEventListener('pointerover', event => {
    const item = event.target.closest('[data-focus-target]')
    if (!item) return
    setFocusFromElement(item)
  })
  resultPanel.addEventListener('pointerout', event => {
    if (event.relatedTarget && resultPanel.contains(event.relatedTarget)) return
    clearFocus()
  })
  resultPanel.addEventListener('focusin', event => {
    const item = event.target.closest('[data-focus-target]')
    if (!item) return
    setFocusFromElement(item)
  })
  resultPanel.addEventListener('focusout', event => {
    if (event.relatedTarget && resultPanel.contains(event.relatedTarget)) return
    clearFocus()
  })
  form.addEventListener('submit', async event => { event.preventDefault(); if (isFiring) return; isFiring = true; clearFocus(); const button = root.querySelector('.fire-button'); button.disabled = true; const input = values(); firedShots = fireSeries(input); visibleMarkers = []; displayedMarkers = []; renderTable(); const allMarkers = visibleShots(firedShots); const summary = allMarkers.reduce((counts, { result }) => ({ ...counts, [result]: (counts[result] || 0) + 1 }), {}); try { await sendFire({ shots: firedShots, rpm: Number(input.rpm), shotCount: getShotCount(input), summary }) } catch (error) { console.log('sync error:', error) } table.classList.add('is-firing'); await new Promise(resolve => setTimeout(resolve, 1000)); await playFireAnimation(firedShots, Number(input.rpm)); table.classList.remove('is-firing'); const count = getShotCount(input); shotCount.textContent = `${count} shot${count === 1 ? '' : 's'} fired`; message.textContent = Object.entries(summary).map(([name, total]) => `${total} ${name}`).join(' · '); isFiring = false; button.disabled = false })
  renderTable(); renderSummary(); setMode(); applyTable(); updateOverlayToggle(); showPage('fire'); Promise.resolve(onAudioStatus(false)).catch(error => console.log('audio status error:', error))
}
