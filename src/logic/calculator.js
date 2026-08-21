export const AIM_SIZE = 12

/** Returns the fixed result stored at a 1-based Aim Table coordinate. */
export function getAimResult(x, y) {
  if (x < 0.5 || x > AIM_SIZE + 0.5 || y < 0.5 || y > AIM_SIZE + 0.5) return 'CRITICAL MISS'
  const cellX = Math.round(x)
  const cellY = Math.round(y)
  if ((cellY === 6 || cellY === 7) && (cellX === 6 || cellX === 7)) return 'PERFECT'
  if (cellY >= 5 && cellY <= 8 && cellX >= 5 && cellX <= 8) return 'GOOD'
  if (cellY >= 3 && cellY <= 10 && cellX >= 3 && cellX <= 10) return 'BAD'
  return 'MISS'
}

export function getCriticalMissArrow(x, y) {
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

function applyDebuff(value, amount, random = Math.random) {
  // A debuff always moves a die away from the true centre of the table.
  if (value === 6.5) return random() < 0.5 ? value - amount : value + amount
  return value <= 6.5 ? value - amount : value + amount
}

function applyBuff(value, amount) {
  // A buff converges to the exact centre and never crosses it.
  if (value < 6.5) return Math.min(6.5, value + amount)
  if (value > 6.5) return Math.max(6.5, value - amount)
  return value
}

function applyAccuracy(value, buff, debuff, mastery, CRc, random) {
  // Accuracy Buff + Weapon Mastery = ลู่เข้าหา 6.5
  value = applyBuff(value, buff)
  value = applyBuff(value, mastery)

  // Accuracy Debuff + Cumulative Recoil = ลู่ออกจาก 6.5
  value = applyDebuff(value, debuff, random)
  value = applyDebuff(value, CRc, random)

  return value
}

const integer = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback
}

const decimal = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback
}

export function getShotCount(input) {
  if (input.mode === 'time') {
    const rpm = Number(input.rpm) || 0
    const seconds = Math.max(0, Number(input.duration) || 0)

    // RPM = 0 : Fire once only
    if (rpm === 0) {
      return 1
    }

    return Math.min(120, Math.max(1, Math.floor(seconds * rpm / 60)))
  }

  return Math.min(120, Math.max(1, integer(input.rounds, 1)))
}

export function applyCumulativeRecoil(state, input) {

  const gunRecoil = Number(input.recoil) || 0
  const str = Math.floor((Number(input.str) || 0) / 2)
  const gunMastery = Number(input.mastery) || 0

  // BPR = RPM ที่ผู้เล่นใส่
  const BPR = Number(input.rpm) || 0

  const RRc = Math.max(
      1 - (BPR / 600),
      0
  )

  const recoilGain = Math.max(
      gunRecoil - str - gunMastery - RRc,
      0
  )

  state.CRc += recoilGain

  return {
    CRc: state.CRc,
    recoilGain,
    RRc
  }
}

/** Roll one d12 for each axis, applying debuff before buff as game rules require. */
export function fireShot(input, state = { CRc: 0 }, random = Math.random) {
  const debuff = decimal(input.debuff)
  const buff = decimal(input.buff)
  const mastery = decimal(input.mastery)

  const rolledX = Math.floor(random() * AIM_SIZE) + 1
  const rolledY = Math.floor(random() * AIM_SIZE) + 1

  const x = applyAccuracy(
      rolledX,
      buff,
      debuff,
      mastery,
      state.CRc,
      random
  )

  const y = applyAccuracy(
      rolledY,
      buff,
      debuff,
      mastery,
      state.CRc,
      random
  )

  return {
    rolledX,
    rolledY,
    x,
    y,
    CRc: state.CRc,
    result: getAimResult(x, y)
  }
}

export function fireSeries(input, random = Math.random) {

  const count = getShotCount(input)

  const state = {
    CRc: 0,
    lastShotTime: 0
  }

  const BPR = Number(input.rpm) || 0

  const interval = BPR > 0
      ? 60000 / BPR
      : Infinity


  const shotgun = input.shotgun === true || input.shotgun === 'on'
  const radius = decimal(input.shotgunRadius)
  const subBulletCount = Math.max(1, integer(input.shotgunSubBullet, 1))
  const shots = []

  Array.from({length: count}, (_, index)=>{

    // ถ้าห่างเกิน 2 วิ ให้คืนศูนย์
    if(index > 0 && interval >= 2000){
      state.CRc = 0
    }


    const shot = fireShot(
        input,
        state,
        random
    )


    applyCumulativeRecoil(
        state,
        input
    )


    if (!shotgun) {
      shots.push({ number: index + 1, round: index + 1, ...shot })
      return
    }

    const subBullets = []
    for (let subBullet = 0; subBullet < subBulletCount; subBullet += 1) {
      const angle = random() * Math.PI * 2
      const distance = Math.sqrt(random()) * radius
      const x = shot.x + Math.cos(angle) * distance
      const y = shot.y + Math.sin(angle) * distance
      subBullets.push({
        number: subBullet + 1,
        x,
        y,
        result: getAimResult(x, y),
        criticalMissArrow: getCriticalMissArrow(x, y)
      })
    }

    shots.push({ number: index + 1, round: index + 1, ...shot, subBullets })

  })

  return shots
}
