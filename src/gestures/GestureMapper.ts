import { GestureType } from './GestureRecognizer'
import { InputManager } from '../input/InputManager'

export class GestureMapper {
  private input: InputManager

  constructor(input: InputManager) { this.input = input }

  handle(gesture: GestureType, hx: number, hy: number) {
    const rx = hx * window.innerWidth
    const ry = hy * window.innerHeight

    if (gesture === 'egg_throw') {
      this.input.showGestureFeedback('👎', 'Egg Throw')
      this.input.setActiveTool(2)
      this.input.triggerToolAt(2, rx, ry)
    } else if (gesture === 'finger_gun') {
      this.input.showGestureFeedback('👆', 'Finger Gun')
      this.input.setActiveTool(3)
      this.input.triggerToolAt(3, rx, ry)
    } else if (gesture === 'punch') {
      this.input.showGestureFeedback('✊', 'Hammer Punch')
      this.input.setActiveTool(0)
      this.input.triggerToolAt(0, rx, ry)
    } else if (gesture === 'two_hand_explosion') {
      this.input.showGestureFeedback('👐', 'Explosion')
      this.input.setActiveTool(4)
      this.input.triggerToolAt(4, rx, ry)
    } else if (gesture === 'mind_blown') {
      this.input.showGestureFeedback('🤯', 'Mind Blown!')
      this.input.setActiveTool(4)
      this.input.triggerToolAt(4, rx, ry)
      this.input.triggerToolAt(4, rx - 200, ry)
      this.input.triggerToolAt(4, rx + 200, ry)
      this.input.triggerMindBlown()
    }
  }
}
