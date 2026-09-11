import { GestureType } from './GestureRecognizer'
import { InputManager } from '../input/InputManager'

/**
 * GestureMapper — translates gesture types into existing InputManager effect calls.
 * Reuses all tool effect code — no parallel effect logic.
 */
export class GestureMapper {
  private input: InputManager

  constructor(input: InputManager) { this.input = input }

  handle(type: GestureType) {
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2

    switch (type) {
      case 'punch':
        // Reuse Hammer (tool index 0) at screen center
        this.input.triggerToolAt(0, cx, cy)
        break
      case 'finger_gun':
        // Reuse Paintball (tool index 3) at screen center
        this.input.triggerToolAt(3, cx, cy)
        break
      case 'two_hand_explosion':
        // Reuse Explosion (tool index 4) at screen center
        this.input.triggerToolAt(4, cx, cy)
        break
      case 'mind_blown':
        // Reuse Explosion at center + extra effects + unlock achievement
        this.input.triggerToolAt(4, cx, cy)
        this.input.triggerToolAt(4, cx - 200, cy)
        this.input.triggerToolAt(4, cx + 200, cy)
        this.input.triggerMindBlown()
        break
    }
  }
}
