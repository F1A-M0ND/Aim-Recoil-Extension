export const AIM_SIZE = 12

/** Returns the fixed result stored at a 1-based Aim Table coordinate. */
export function getAimResult(x, y) {
  if (x < 1 || x > AIM_SIZE || y < 1 || y > AIM_SIZE) return 'CRITICAL MISS'
  const cellX = Math.round(x)
  const cellY = Math.round(y)
  if ((cellY === 6 || cellY === 7) && (cellX === 6 || cellX === 7)) return 'PERFECT'
  if (cellY >= 5 && cellY <= 8 && cellX >= 5 && cellX <= 8) return 'GOOD'
  if (cellY >= 3 && cellY <= 10 && cellX >= 3 && cellX <= 10) return 'BAD'
  return 'MISS'
}

function applyDebuff(value, amount) {
  // A debuff always moves a die away from the true centre of the table.
  return value <= 6.5 ? value - amount : value + amount
}

function applyBuff(value, amount) {
  // A buff converges to the exact centre and never crosses it.
  if (value < 6.5) return Math.min(6.5, value + amount)
  if (value > 6.5) return Math.max(6.5, value - amount)
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
    const rpm = Math.max(1, Number(input.rpm) || 600)
    const seconds = Math.max(0, Number(input.duration) || 0)
    return Math.min(120, Math.max(1, Math.floor(seconds * rpm / 60)))
  }
  return Math.min(120, Math.max(1, integer(input.rounds, 1)))
}

/** Roll one d12 for each axis, applying debuff before buff as game rules require. */
export function fireShot(input, random = Math.random) {
  const debuff = decimal(input.debuff)
  const buff = decimal(input.buff)
  const rolledX = Math.floor(random() * AIM_SIZE) + 1
  const rolledY = Math.floor(random() * AIM_SIZE) + 1
  const afterDebuffX = applyDebuff(rolledX, debuff)
  const afterDebuffY = applyDebuff(rolledY, debuff)
  const x = applyBuff(afterDebuffX, buff)
  const y = applyBuff(afterDebuffY, buff)
  return { rolledX, rolledY, x, y, result: getAimResult(x, y), debuff, buff }
}

export function fireSeries(input, random = Math.random) {
  const count = getShotCount(input)
  return Array.from({ length: count }, (_, index) => ({ number: index + 1, ...fireShot(input, random) }))
}
