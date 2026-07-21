import { Instance } from 'cooljs'
import { blockAction, blockPainter } from './block'
import {
  checkMoveDown,
  getMoveDownValue,
  drawYellowString,
  getAngleBase,
  loadHighScore,
  getComboMultiplier,
  getLevelConfig,
  calculateStars,
  saveStars,
  saveUnlockedLevel
} from './utils'
import { addFlight } from './flight'
import * as constant from './constant'

export const endAnimate = (engine) => {
  const gameStartNow = engine.getVariable(constant.gameStartNow)
  const levelCompleted = engine.getVariable(constant.levelCompleted, false)

  if (levelCompleted) {
    drawVictoryScreen(engine)
    return
  }

  if (!gameStartNow) return
  const successCount = engine.getVariable(constant.successCount, 0)
  const failedCount = engine.getVariable(constant.failedCount)
  const gameScore = engine.getVariable(constant.gameScore, 0)
  const { ctx } = engine

  const levelId = engine.getVariable(constant.currentLevel)
  if (levelId) {
    const cfg = getLevelConfig(levelId)
    const progress = Math.min(successCount / cfg.target, 1)
    const barWidth = engine.width * 0.5
    const barHeight = engine.width * 0.03
    const barX = engine.width * 0.25
    const barY = engine.width * 0.06

    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fillRect(barX, barY, barWidth, barHeight)
    const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth * progress, barY)
    gradient.addColorStop(0, '#FFD700')
    gradient.addColorStop(1, '#FF8C00')
    ctx.fillStyle = gradient
    ctx.fillRect(barX, barY, barWidth * progress, barHeight)
    ctx.strokeStyle = '#FFF'
    ctx.lineWidth = 1
    ctx.strokeRect(barX, barY, barWidth, barHeight)
    ctx.restore()

    drawYellowString(engine, {
      string: `${cfg.name}`,
      size: engine.width * 0.04,
      x: engine.width * 0.5,
      y: barY + barHeight + engine.width * 0.03,
      textAlign: 'center',
      fontName: 'Arial',
      fontWeight: 'bold'
    })

    drawYellowString(engine, {
      string: `${successCount}/${cfg.target}`,
      size: engine.width * 0.035,
      x: engine.width * 0.5,
      y: barY - engine.width * 0.005,
      textAlign: 'center',
      fontName: 'Arial',
      fontWeight: 'bold'
    })
  } else {
    const threeFiguresOffset = Number(successCount) > 99 ? engine.width * 0.1 : 0
    drawYellowString(engine, {
      string: 'floor',
      size: engine.width * 0.06,
      x: (engine.width * 0.24) + threeFiguresOffset,
      y: engine.width * 0.12,
      textAlign: 'left',
      fontName: 'Arial',
      fontWeight: 'bold'
    })
    drawYellowString(engine, {
      string: successCount,
      size: engine.width * 0.17,
      x: (engine.width * 0.22) + threeFiguresOffset,
      y: engine.width * 0.2,
      textAlign: 'right'
    })
  }

  const score = engine.getImg('score')
  const scoreWidth = score.width
  const scoreHeight = score.height
  const zoomedWidth = engine.width * 0.35
  const zoomedHeight = (scoreHeight * zoomedWidth) / scoreWidth
  engine.ctx.drawImage(
    score,
    engine.width * 0.61,
    engine.width * 0.038,
    zoomedWidth,
    zoomedHeight
  )
  drawYellowString(engine, {
    string: gameScore,
    size: engine.width * 0.06,
    x: engine.width * 0.9,
    y: engine.width * 0.11,
    textAlign: 'right'
  })
  const heart = engine.getImg('heart')
  const heartWidth = heart.width
  const heartHeight = heart.height
  const zoomedHeartWidth = engine.width * 0.08
  const zoomedHeartHeight = (heartHeight * zoomedHeartWidth) / heartWidth
  for (let i = 1; i <= 3; i += 1) {
    ctx.save()
    if (i <= failedCount) {
      ctx.globalAlpha = 0.2
    }
    ctx.drawImage(
      heart,
      (engine.width * 0.66) + ((i - 1) * zoomedHeartWidth),
      engine.width * 0.16,
      zoomedHeartWidth,
      zoomedHeartHeight
    )
    ctx.restore()
  }
  const best = engine.getVariable(constant.highScore, 0)
  if (best > 0) {
    drawYellowString(engine, {
      string: `BEST ${best}`,
      size: engine.width * 0.035,
      x: engine.width * 0.5,
      y: engine.width * 0.23,
      textAlign: 'center',
      fontName: 'Arial',
      fontWeight: 'bold'
    })
  }

  const combo = engine.getVariable(constant.comboCount, 0)
  const comboTimer = engine.getVariable(constant.comboTimer, 0)
  if (combo >= 5 && comboTimer > 0) {
    const elapsed = Date.now() - comboTimer
    if (elapsed < 1500) {
      const progress = elapsed / 1500
      const scale = 1 + Math.sin(progress * Math.PI) * 0.3
      const alpha = 1 - progress
      const multiplier = getComboMultiplier(combo)
      const colors = ['', '', '', '#FFD700', '#FF8C00', '#FF4500', '#FF00FF']
      const color = colors[Math.min(multiplier, colors.length - 1)] || '#FFD700'
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.font = `bold ${engine.width * 0.1 * scale}px Arial`
      ctx.textAlign = 'center'
      ctx.fillStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = 20 * scale
      ctx.fillText(`x${multiplier}`, engine.width * 0.5, engine.height * 0.45)
      ctx.restore()
    }
  }
}

const drawVictoryScreen = (engine) => {
  const { ctx, width, height } = engine
  const successCount = engine.getVariable(constant.successCount, 0)
  const perfectCount = engine.getVariable(constant.levelPerfects, 0)
  const gameScore = engine.getVariable(constant.gameScore, 0)
  const levelId = engine.getVariable(constant.currentLevel)
  const cfg = getLevelConfig(levelId)
  const stars = calculateStars(cfg, successCount, perfectCount)

  saveStars(levelId, stars)
  if (stars > 0) {
    const nextLevels = [levelId + 1, levelId + 2]
    nextLevels.forEach(id => { if (id <= 10) saveUnlockedLevel(id) })
  }

  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.7)'
  ctx.fillRect(0, 0, width, height)
  ctx.restore()

  drawYellowString(engine, {
    string: 'NIVEAU TERMINE !',
    size: width * 0.08,
    x: width * 0.5,
    y: height * 0.25,
    textAlign: 'center',
    fontName: 'Arial',
    fontWeight: 'bold'
  })

  drawYellowString(engine, {
    string: cfg.name,
    size: width * 0.05,
    x: width * 0.5,
    y: height * 0.32,
    textAlign: 'center',
    fontName: 'Arial',
    fontWeight: 'bold'
  })

  const starY = height * 0.42
  const starSize = width * 0.1
  for (let i = 0; i < 3; i += 1) {
    const sx = width * 0.35 + (i * starSize * 1.3)
    ctx.save()
    if (i < stars) {
      ctx.font = `${starSize}px Arial`
      ctx.textAlign = 'center'
      ctx.fillStyle = '#FFD700'
      ctx.shadowColor = '#FFD700'
      ctx.shadowBlur = 15
      ctx.fillText('★', sx, starY)
    } else {
      ctx.font = `${starSize}px Arial`
      ctx.textAlign = 'center'
      ctx.fillStyle = '#555'
      ctx.fillText('☆', sx, starY)
    }
    ctx.restore()
  }

  drawYellowString(engine, {
    string: `Score: ${gameScore}`,
    size: width * 0.045,
    x: width * 0.5,
    y: height * 0.55,
    textAlign: 'center',
    fontName: 'Arial'
  })

  drawYellowString(engine, {
    string: `Parfaits: ${perfectCount}/${successCount}`,
    size: width * 0.035,
    x: width * 0.5,
    y: height * 0.61,
    textAlign: 'center',
    fontName: 'Arial'
  })

  const { ctx: ctx2 } = engine
  const btnW = width * 0.4
  const btnH = width * 0.1
  const btnY = height * 0.7

  ctx2.save()
  ctx2.fillStyle = '#FF8C00'
  ctx2.fillRect(width * 0.08, btnY, btnW, btnH)
  ctx2.fillStyle = '#FFF'
  ctx2.font = `bold ${width * 0.035}px Arial`
  ctx2.textAlign = 'center'
  ctx2.fillText('MENU', width * 0.08 + btnW / 2, btnY + btnH * 0.65)
  ctx2.restore()

  if (stars > 0 && levelId < 10) {
    ctx2.save()
    ctx2.fillStyle = '#4CAF50'
    ctx2.fillRect(width * 0.52, btnY, btnW, btnH)
    ctx2.fillStyle = '#FFF'
    ctx2.font = `bold ${width * 0.035}px Arial`
    ctx2.textAlign = 'center'
    ctx2.fillText('SUIVANT', width * 0.52 + btnW / 2, btnY + btnH * 0.65)
    ctx2.restore()
  }

  engine._victoryBtns = {
    menu: { x: width * 0.08, y: btnY, w: btnW, h: btnH },
    next: stars > 0 && levelId < 10 ? { x: width * 0.52, y: btnY, w: btnW, h: btnH } : null
  }
}

export const startAnimate = (engine) => {
  const gameStartNow = engine.getVariable(constant.gameStartNow)
  if (!gameStartNow) return
  const lastBlock = engine.getInstance(`block_${engine.getVariable(constant.blockCount)}`)
  if (!lastBlock || [constant.land, constant.out].indexOf(lastBlock.status) > -1) {
    if (checkMoveDown(engine) && getMoveDownValue(engine)) return
    if (engine.checkTimeMovement(constant.hookUpMovement)) return
    const angleBase = getAngleBase(engine)
    const initialAngle = (Math.PI
        * engine.utils.random(angleBase, angleBase + 5)
        * engine.utils.randomPositiveNegative()
    ) / 180
    engine.setVariable(constant.blockCount, engine.getVariable(constant.blockCount) + 1)
    engine.setVariable(constant.initialAngle, initialAngle)
    engine.setTimeMovement(constant.hookDownMovement, 500)
    const block = new Instance({
      name: `block_${engine.getVariable(constant.blockCount)}`,
      action: blockAction,
      painter: blockPainter
    })
    engine.addInstance(block)
  }
  const successCount = Number(engine.getVariable(constant.successCount, 0))
  switch (successCount) {
    case 2:
      addFlight(engine, 1, 'leftToRight')
      break
    case 6:
      addFlight(engine, 2, 'rightToLeft')
      break
    case 8:
      addFlight(engine, 3, 'leftToRight')
      break
    case 14:
      addFlight(engine, 4, 'bottomToTop')
      break
    case 18:
      addFlight(engine, 5, 'bottomToTop')
      break
    case 22:
      addFlight(engine, 6, 'bottomToTop')
      break
    case 25:
      addFlight(engine, 7, 'rightTopToLeft')
      break
    default:
      break
  }
}

