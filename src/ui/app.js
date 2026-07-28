import { AIM_SIZE, fireSeries, getShotCount } from '../logic/calculator.js'
import { clearAimOverlays, projectAimOverlay } from '../obr/board.js'

const CELL_LABEL = { PERFECT: 'P', GOOD: 'G', BAD: 'B', MISS: 'M' }
const cssResult = (result) => result.toLowerCase().replace(' ', '-')
const fmt = (value) => Number(value).toFixed(2)

function cellType(x, y) {
  if ((y === 6 || y === 7) && (x === 6 || x === 7)) return 'PERFECT'
  if (y >= 5 && y <= 8 && x >= 5 && x <= 8) return 'GOOD'
  if (y >= 3 && y <= 10 && x >= 3 && x <= 10) return 'BAD'
  return 'MISS'
}

function tableMarkup(shots = []) {
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
    const stack = stacks.get(`${x.toFixed(4)}:${y.toFixed(4)}`)
    const overlap = stack.length > 1 ? ` · overlaps #${stack.filter((item) => item !== number).join(', #')}` : ''
    const offset = stack.length > 1 ? (stack.indexOf(number) - (stack.length - 1) / 2) * 5 : 0
    return `<button class="shot-marker" data-shot="${number}" style="left:${left}%;top:${top}%;--marker-colour:hsl(${(number % 10) * 36} 78% 52%);--stack-offset:${offset}px" title="Shot #${number}: (${fmt(x)}, ${fmt(y)})${overlap}">${number}</button>`
  }).join('')
  return `<div class="aim-grid">${cells}</div><div class="aim-rings" aria-hidden="true"><i></i><i></i><i></i><b></b><em></em></div><div class="axis-label axis-x">X AXIS</div><div class="axis-label axis-y">Y AXIS</div><div class="marker-layer" aria-label="Shot markers">${markers}</div>`
}

export function createApp(root, { isConnected }) {
  root.innerHTML = `
    <main class="app-shell">
      <header><p class="eyebrow">Owlbear Rodeo · Combat Planner</p><h1>Aim System</h1></header>
      <section class="status-card"><span class="status-dot ${isConnected ? 'is-connected' : ''}"></span><p>${isConnected ? 'Connected to Owlbear Rodeo' : 'Preview mode — open inside Owlbear Rodeo to project'}</p></section>
      <form class="control-card" id="combat-form">
        <div class="mode-row"><label><input type="radio" name="mode" value="count" checked> Bullet Count</label><label><input type="radio" name="mode" value="time"> Timebase</label></div>
        <div class="field-grid">
          <label>Fire rate <input name="rpm" type="number" min="1" max="2400" value="600"><small>RPM (Timebase only)</small></label>
          <label>Accuracy Debuff <input name="debuff" type="number" min="0" step="0.01" value="0"><small>moves outward first</small></label>
          <label>Accuracy Buff <input name="buff" type="number" min="0" step="0.01" value="0"><small>then converges inward</small></label>
          <label data-mode="count">Rounds <input name="rounds" type="number" min="1" max="120" value="1"><small>shots to fire</small></label>
          <label data-mode="time" hidden>Time Trigger <input name="duration" type="number" min="0.1" max="60" step="0.1" value="1"><small>seconds held</small></label>
          <label>
  Recoil Weapon
  <input name="recoil" type="number" min="0" step="0.01" value="0">
  <small>weapon recoil value</small>
</label>
<label>
  Strength
  <input name="Strength" type="number" min="0" step="1" value="0">
  <small>weapon recoil value</small>
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

        <div class="board-actions">
          <button class="secondary" id="project" type="button" disabled>
            Project to board
          </button>
          <button class="ghost" id="clear" type="button" ${isConnected ? '' : 'disabled'}>
            Clear markers
          </button>
        </div>

        <p class="action-message" id="action-message"></p>
      </section>
    </main>`

  const form = root.querySelector('#combat-form')
  const table = root.querySelector('#aim-table')
  const resultPanel = root.querySelector('#fire-result')
  const shotCount = root.querySelector('#shot-count')
  const project = root.querySelector('#project')
  const message = root.querySelector('#action-message')
  let firedShots = []
  const values = () => Object.fromEntries(new FormData(form))
  const setMode = () => {
    const timeMode = values().mode === 'time'
    form.querySelector('[data-mode="time"]').hidden = !timeMode
    form.querySelector('[data-mode="count"]').hidden = timeMode
    shotCount.textContent = `Will fire ${getShotCount(values())} shot${getShotCount(values()) === 1 ? '' : 's'}`
  }
  const renderSummary = () => {
    if (!firedShots.length) {
      resultPanel.textContent = 'Press Fire to roll d12 for X and Y.'
      return
    }
    resultPanel.innerHTML = firedShots.map(({ number, rolledX, rolledY, x, y, result }) => `<button class="shot-output" data-shot="${number}" type="button"><b>#${number}</b> d12 (${rolledX}, ${rolledY}) → (${fmt(x)}, ${fmt(y)}) <strong class="${cssResult(result)}">${result}</strong></button>`).join('')
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
  const renderTable = () => {
    table.innerHTML = tableMarkup(firedShots)
    table.querySelectorAll('.shot-marker').forEach((marker) => {
      const number = Number(marker.dataset.shot)
      marker.addEventListener('mouseenter', () => focusShot(number))
      marker.addEventListener('focus', () => focusShot(number))
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
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    firedShots = fireSeries(values())
    renderTable()
    const summary = firedShots.reduce((counts, { result }) => ({ ...counts, [result]: (counts[result] || 0) + 1 }), {})
    renderSummary()
    shotCount.textContent = `${firedShots.length} shot${firedShots.length === 1 ? '' : 's'} fired`
    message.textContent = Object.entries(summary).map(([name, count]) => `${count} ${name}`).join(' · ')
    project.disabled = !isConnected
  })
  project.addEventListener('click', async () => {
    try { message.textContent = `${await projectAimOverlay(firedShots)} valid shot marker(s) added to the board.` } catch (error) { message.textContent = error.message }
  })
  root.querySelector('#clear').addEventListener('click', async () => {
    try { message.textContent = `${await clearAimOverlays()} aim marker(s) removed.` } catch (error) { message.textContent = error.message }
  })
  renderTable()
  setMode()
}
