import * as constant from './constant'
import { levels } from './levels'

const HIGHSCORE_KEY = 'tower_best_score'
const UNLOCKED_KEY = 'tower_unlocked_levels'
const STARS_KEY = 'tower_stars'

export const loadHighScore = () => {
  try {
    return parseInt(localStorage.getItem(HIGHSCORE_KEY), 10) || 0
  } catch (e) {
    return 0
  }
}

export const saveHighScore = (score) => {
  try {
    const best = loadHighScore()
    if (score > best) {
      localStorage.setItem(HIGHSCORE_KEY, score)
      return score
    }
    return best
  } catch (e) {
    return score
  }
}

export const loadUnlockedLevels = () => {
  try {
    return JSON.parse(localStorage.getItem(UNLOCKED_KEY)) || [1]
  } catch (e) {
    return [1]
  }
}

export const saveUnlockedLevel = (levelId) => {
  try {
    const unlocked = loadUnlockedLevels()
    if (!unlocked.includes(levelId)) {
      unlocked.push(levelId)
      localStorage.setItem(UNLOCKED_KEY, JSON.stringify(unlocked))
    }
  } catch (e) {}
}

export const loadStars = () => {
  try {
    return JSON.parse(localStorage.getItem(STARS_KEY)) || {}
  } catch (e) {
    return {}
  }
}

export const saveStars = (levelId, stars) => {
  try {
    const allStars = loadStars()
    const prev = allStars[levelId] || 0
    if (stars > prev) {
      allStars[levelId] = stars
      localStorage.setItem(STARS_KEY, JSON.stringify(allStars))
    }
  } catch (e) {}
}

export const getLevelConfig = (levelId) => {
  return levels.find(l => l.id === levelId) || levels[0]
}

export const calculateStars = (levelConfig, successCount, perfectCount) => {
  if (successCount >= levelConfig.target) {
    if (perfectCount >= levelConfig.target) return 3
    if (perfectCount >= levelConfig.target * 0.8) return 2
    return 1
  }
  return 0
}

export const checkMoveDown = engine =>
  (engine.checkTimeMovement(constant.moveDownMovement))

export const getMoveDownValue = (engine, store) => {
  const pixelsPerFrame = store ? store.pixelsPerFrame : engine.pixelsPerFrame.bind(engine)
  const successCount = engine.getVariable(constant.successCount)
  const calHeight = engine.getVariable(constant.blockHeight) * 2
  if (successCount <= 4) {
    return pixelsPerFrame(calHeight * 1.25)
  }
  return pixelsPerFrame(calHeight)
}

export const getAngleBase = (engine) => {
  const successCount = engine.getVariable(constant.successCount)
  const gameScore = engine.getVariable(constant.gameScore)
  const { hookAngle } = engine.getVariable(constant.gameUserOption)
  if (hookAngle) {
    return hookAngle(successCount, gameScore)
  }
  const levelId = engine.getVariable(constant.currentLevel)
  if (levelId) {
    return getLevelConfig(levelId).angle
  }
  if (engine.getVariable(constant.hardMode)) {
    return 90
  }
  switch (true) {
    case successCount < 10:
      return 30
    case successCount < 20:
      return 60
    default:
      return 80
  }
}

export const getSwingBlockVelocity = (engine, time) => {
  const successCount = engine.getVariable(constant.successCount)
  const gameScore = engine.getVariable(constant.gameScore)
  const { hookSpeed } = engine.getVariable(constant.gameUserOption)
  if (hookSpeed) {
    return hookSpeed(successCount, gameScore)
  }
  const levelId = engine.getVariable(constant.currentLevel)
  let hard
  if (levelId) {
    const cfg = getLevelConfig(levelId)
    hard = cfg.reverse ? -1 : 1
  } else {
    switch (true) {
      case successCount < 1:
        hard = 0
        break
      case successCount < 10:
        hard = 1
        break
      case successCount < 20:
        hard = 0.8
        break
      case successCount < 30:
        hard = 0.7
        break
      default:
        hard = 0.74
        break
    }
    if (engine.getVariable(constant.hardMode)) {
      hard = 1.1
    }
  }
  return Math.sin(time / (200 / hard))
}

export const getLandBlockVelocity = (engine, time) => {
  const successCount = engine.getVariable(constant.successCount)
  const gameScore = engine.getVariable(constant.gameScore)
  const { landBlockSpeed } = engine.getVariable(constant.gameUserOption)
  if (landBlockSpeed) {
    return landBlockSpeed(successCount, gameScore)
  }
  const { width } = engine
  const levelId = engine.getVariable(constant.currentLevel)
  let hard
  if (levelId) {
    hard = getLevelConfig(levelId).drift
  } else {
    switch (true) {
      case successCount < 5:
        hard = 0
        break
      case successCount < 13:
        hard = 0.001
        break
      case successCount < 23:
        hard = 0.002
        break
      default:
        hard = 0.003
        break
    }
  }
  return Math.cos(time / 200) * hard * width
}

export const getHookStatus = (engine) => {
  if (engine.checkTimeMovement(constant.hookDownMovement)) {
    return constant.hookDown
  }
  if (engine.checkTimeMovement(constant.hookUpMovement)) {
    return constant.hookUp
  }
  return constant.hookNormal
}

export const touchEventHandler = (engine) => {
  if (!engine.getVariable(constant.gameStartNow)) return
  if (engine.debug && engine.paused) {
    return
  }
  if (getHookStatus(engine) !== constant.hookNormal) {
    return
  }
  engine.removeInstance('tutorial')
  engine.removeInstance('tutorial-arrow')
  const b = engine.getInstance(`block_${engine.getVariable(constant.blockCount)}`)
  if (b && b.status === constant.swing) {
    engine.setTimeMovement(constant.hookUpMovement, 500)
    b.status = constant.beforeDrop
  }
}

export const addSuccessCount = (engine) => {
  const { setGameSuccess } = engine.getVariable(constant.gameUserOption)
  const lastSuccessCount = engine.getVariable(constant.successCount)
  const success = lastSuccessCount + 1
  engine.setVariable(constant.successCount, success)
  if (engine.getVariable(constant.hardMode)) {
    engine.setVariable(constant.ropeHeight, engine.height * engine.utils.random(0.35, 0.55))
  }
  if (setGameSuccess) setGameSuccess(success)
}

export const addFailedCount = (engine) => {
  const { setGameFailed } = engine.getVariable(constant.gameUserOption)
  const lastFailedCount = engine.getVariable(constant.failedCount)
  const failed = lastFailedCount + 1
  engine.setVariable(constant.failedCount, failed)
  engine.setVariable(constant.perfectCount, 0)
  engine.setVariable(constant.comboCount, 0)
  if (setGameFailed) setGameFailed(failed)
  if (failed >= 3) {
    engine.pauseAudio('bgm')
    engine.playAudio('game-over')
    engine.setVariable(constant.gameStartNow, false)
  }
}

export const getComboMultiplier = (combo) => {
  if (combo >= 20) return 5
  if (combo >= 15) return 4
  if (combo >= 10) return 3
  if (combo >= 5) return 2
  return 1
}

export const addScore = (engine, isPerfect) => {
  const { setGameScore, successScore, perfectScore } = engine.getVariable(constant.gameUserOption)
  const lastPerfectCount = engine.getVariable(constant.perfectCount, 0)
  const lastGameScore = engine.getVariable(constant.gameScore)
  const perfect = isPerfect ? lastPerfectCount + 1 : 0

  let combo = engine.getVariable(constant.comboCount, 0)
  if (isPerfect) {
    combo += 1
  } else {
    combo = 0
  }
  engine.setVariable(constant.comboCount, combo)
  engine.setVariable(constant.comboTimer, Date.now())

  const multiplier = getComboMultiplier(combo)
  const baseScore = (successScore || 25) + ((perfectScore || 25) * perfect)
  const score = lastGameScore + (baseScore * multiplier)
  engine.setVariable(constant.gameScore, score)
  engine.setVariable(constant.perfectCount, perfect)
  const newBest = saveHighScore(score)
  engine.setVariable(constant.highScore, newBest)
  if (setGameScore) setGameScore(score)
}

export const drawYellowString = (engine, option) => {
  const {
    string, size, x, y, textAlign, fontName = 'wenxue', fontWeight = 'normal'
  } = option
  const { ctx } = engine
  const fontSize = size
  const lineSize = fontSize * 0.1
  ctx.save()
  ctx.beginPath()
  const gradient = ctx.createLinearGradient(0, 0, 0, y)
  gradient.addColorStop(0, '#FAD961')
  gradient.addColorStop(1, '#F76B1C')
  ctx.fillStyle = gradient
  ctx.lineWidth = lineSize
  ctx.strokeStyle = '#FFF'
  ctx.textAlign = textAlign || 'center'
  ctx.font = `${fontWeight} ${fontSize}px ${fontName}`
  ctx.strokeText(string, x, y)
  ctx.fillText(string, x, y)
  ctx.restore()
}
