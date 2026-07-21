import { Engine, Instance } from 'cooljs'
import { touchEventHandler, loadHighScore, getLevelConfig } from './utils'
import { background } from './background'
import { lineAction, linePainter } from './line'
import { cloudAction, cloudPainter } from './cloud'
import { hookAction, hookPainter } from './hook'
import { tutorialAction, tutorialPainter } from './tutorial'
import * as constant from './constant'
import { startAnimate, endAnimate } from './animateFuncs'

window.TowerGame = (option = {}) => {
  const {
    width,
    height,
    canvasId,
    soundOn
  } = option
  const game = new Engine({
    canvasId,
    highResolution: true,
    width,
    height,
    soundOn
  })
  const pathGenerator = (path) => `./assets/${path}`

  game.addImg('background', pathGenerator('background.png'))
  game.addImg('hook', pathGenerator('hook.png'))
  game.addImg('blockRope', pathGenerator('block-rope.png'))
  game.addImg('block', pathGenerator('block.png'))
  game.addImg('block-perfect', pathGenerator('block-perfect.png'))
  for (let i = 1; i <= 8; i += 1) {
    game.addImg(`c${i}`, pathGenerator(`c${i}.png`))
  }
  game.addLayer(constant.flightLayer)
  for (let i = 1; i <= 7; i += 1) {
    game.addImg(`f${i}`, pathGenerator(`f${i}.png`))
  }
  game.swapLayer(0, 1)
  game.addImg('tutorial', pathGenerator('tutorial.png'))
  game.addImg('tutorial-arrow', pathGenerator('tutorial-arrow.png'))
  game.addImg('heart', pathGenerator('heart.png'))
  game.addImg('score', pathGenerator('score.png'))
  game.addAudio('drop-perfect', pathGenerator('drop-perfect.mp3'))
  game.addAudio('drop', pathGenerator('drop.mp3'))
  game.addAudio('game-over', pathGenerator('game-over.mp3'))
  game.addAudio('rotate', pathGenerator('rotate.mp3'))
  game.addAudio('bgm', pathGenerator('bgm.mp3'))
  game.setVariable(constant.blockWidth, game.width * 0.25)
  game.setVariable(constant.blockHeight, game.getVariable(constant.blockWidth) * 0.71)
  game.setVariable(constant.cloudSize, game.width * 0.3)
  game.setVariable(constant.ropeHeight, game.height * 0.4)
  game.setVariable(constant.blockCount, 0)
  game.setVariable(constant.successCount, 0)
  game.setVariable(constant.failedCount, 0)
  game.setVariable(constant.gameScore, 0)
  game.setVariable(constant.comboCount, 0)
  game.setVariable(constant.comboTimer, 0)
  game.setVariable(constant.hardMode, false)
  game.setVariable(constant.flightCount, 0)
  game.setVariable(constant.highScore, loadHighScore())
  game.setVariable(constant.gameUserOption, option)
  for (let i = 1; i <= 4; i += 1) {
    const cloud = new Instance({
      name: `cloud_${i}`,
      action: cloudAction,
      painter: cloudPainter
    })
    cloud.index = i
    cloud.count = 5 - i
    game.addInstance(cloud)
  }
  const line = new Instance({
    name: 'line',
    action: lineAction,
    painter: linePainter
  })
  game.addInstance(line)
  const hook = new Instance({
    name: 'hook',
    action: hookAction,
    painter: hookPainter
  })
  game.addInstance(hook)

  game.startAnimate = startAnimate
  game.endAnimate = endAnimate
  game.paintUnderInstance = background
  game.addKeyDownListener('enter', () => {
    if (game.debug) game.togglePaused()
  })
  game.touchStartListener = (e) => {
    const levelCompleted = game.getVariable(constant.levelCompleted, false)
    if (levelCompleted && game._victoryBtns) {
      const rect = e.target.getBoundingClientRect()
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
      const btns = game._victoryBtns
      if (btns.menu && x >= btns.menu.x && x <= btns.menu.x + btns.menu.w
        && y >= btns.menu.y && y <= btns.menu.y + btns.menu.h) {
        game.setVariable(constant.levelCompleted, false)
        game.setVariable(constant.gameStartNow, false)
        if (typeof window.showLevelSelect === 'function') window.showLevelSelect()
        return
      }
      if (btns.next && x >= btns.next.x && x <= btns.next.x + btns.next.w
        && y >= btns.next.y && y <= btns.next.y + btns.next.h) {
        game.setVariable(constant.levelCompleted, false)
        const nextLevel = game.getVariable(constant.currentLevel) + 1
        if (typeof window.startLevel === 'function') window.startLevel(nextLevel)
        return
      }
      return
    }
    touchEventHandler(game)
  }

  game.playBgm = () => {
    game.playAudio('bgm', true)
  }

  game.pauseBgm = () => {
    game.pauseAudio('bgm')
  }

  game.start = (levelId) => {
    game.setVariable(constant.successCount, 0)
    game.setVariable(constant.failedCount, 0)
    game.setVariable(constant.gameScore, 0)
    game.setVariable(constant.blockCount, 0)
    game.setVariable(constant.perfectCount, 0)
    game.setVariable(constant.comboCount, 0)
    game.setVariable(constant.comboTimer, 0)
    game.setVariable(constant.hardMode, false)
    game.setVariable(constant.levelPerfects, 0)
    game.setVariable(constant.levelCompleted, false)
    game.setVariable(constant.gameStartNow, false)

    if (levelId) {
      game.setVariable(constant.currentLevel, levelId)
      const cfg = getLevelConfig(levelId)
      game.setVariable(constant.blockWidth, game.width * 0.25 * cfg.blockScale)
      game.setVariable(constant.blockHeight, game.getVariable(constant.blockWidth) * 0.71)
      game.setVariable(constant.ropeHeight, game.height * 0.4)
    } else {
      game.setVariable(constant.currentLevel, 0)
      game.setVariable(constant.blockWidth, game.width * 0.25)
      game.setVariable(constant.blockHeight, game.getVariable(constant.blockWidth) * 0.71)
      game.setVariable(constant.ropeHeight, game.height * 0.4)
    }

    const tutorial = new Instance({
      name: 'tutorial',
      action: tutorialAction,
      painter: tutorialPainter
    })
    game.addInstance(tutorial)
    const tutorialArrow = new Instance({
      name: 'tutorial-arrow',
      action: tutorialAction,
      painter: tutorialPainter
    })
    game.addInstance(tutorialArrow)
    game.setTimeMovement(constant.bgInitMovement, 500)
    game.setTimeMovement(constant.tutorialMovement, 500)
    game.setVariable(constant.gameStartNow, true)
  }

  return game
}
