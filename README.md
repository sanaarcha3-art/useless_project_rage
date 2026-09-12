<img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />

# RageDesk 🎯


## Basic Details
### Team Name: Stitch & Lilo


### Team Members
- Team Lead: Aarcha S Nair - Lourdes Matha Collage Of Science And Technology
- Member 2: Mishal S- Lourdes Matha Collage Of Science And Technology


### Project Description
RageDesk — because sometimes "force quit" just doesn't hit hard enough.

Ever wanted to hammer your desktop into oblivion, drill a hole through Chrome, or nuke your inbox with a black hole — without your IT department finding out? RageDesk is a completely fake, completely satisfying virtual rage room that lives on top of your actual screen. Hit a hotkey, and suddenly your real desktop is covered in cracks, eggs, fire, and explosions... that aren't actually there. Your files are safe. Your apps are safe. Your dignity, less so, especially once you unlock Finger-Guns Mode and start bullet-holing your own spreadsheets.

Got a webcam? Even better — throw an actual punch at your monitor, pull off a two-hand explosion gesture like you're in a Michael Bay film, or hold two fingers to your temple for the coveted MIND = BLOWN achievement (side effects include a screen-sized cartoon explosion and mild ego repair).

Smash. Drill. Combo. Reset. Press Escape. Go back to pretending you're a calm, professional adult.

### The Problem (that doesn't exist)
Sometimes, your code won't compile, your browser freezes, or you get *that* email from your boss. Naturally, the only logical response is to take a physical sledgehammer and smash your monitor into a thousand pieces. But monitors are expensive, and HR/parents heavily frowns upon property destruction.

### The Solution (that nobody asked for)
A transparent, invisible desktop overlay that turns your actual screen into a destructible playground! Using your mouse—or actual hand gestures via your webcam—you can smash your screen with a hammer, burn your desktop with realistic spreading fire, or open a black hole to suck away your problems. When you're done throwing a tantrum, simply press `ESC`, and your desktop is instantly pristine again as if nothing ever happened!

## Technical Details
### Technologies/Components Used
For Software:
- **Languages used:** TypeScript, HTML5, CSS3
- **Frameworks used:** Electron.js, Vite
- **Libraries used:** Pixi.js (for high-performance WebGL 2D rendering and particle physics), Howler.js (for audio), MediaPipe Tasks Vision (for AI webcam gesture recognition).
- **Tools used:** npm, electron-builder, PowerShell (for Win32 window context enumeration)

### Implementation
For Software:
# Installation
bash
git clone https://github.com/sanaarcha3-art/useless_project_rage.git
cd ragedesk
npm install

# Run
#To run in development mode:
npm run electron:dev

#To build the final Windows executable:
npm run electron:build

#If you just want a portable .exe folder without an installer
npm run electron:portable

### Project Documentation
For Software:

# Screenshots

![Screenshot1]
*Smash the screen with a hammer, causing it to crack.*

<img width="1588" height="1077" alt="Screenshot 2026-09-12 053012" src="https://github.com/user-attachments/assets/8b00a08e-ac48-44a0-b8bc-45a4fed09081" />


![Screenshot2]
*Creating an explosion on the screen.s*

<img width="1576" height="1073" alt="Screenshot 2026-09-12 053056" src="https://github.com/user-attachments/assets/ebc5158f-1200-4ea9-8579-cc4c2014893b" />


![Screenshot3]
*Set the screen on fire, causing it to burn.*

<img width="1591" height="1078" alt="Screenshot 2026-09-12 053202" src="https://github.com/user-attachments/assets/dc77d6b4-da81-42e7-aed9-587f714f2ab5" />




# Diagrams
![Workflow]
<img width="2720" height="2768" alt="ragedesk_workflow_diagram" src="https://github.com/user-attachments/assets/2e80de3d-21d2-40f3-9a57-2ae04df035c0" />

*Here's the full flow in words, start to finish:

**1. Idle in the tray.** RageDesk launches with no visible window — it just sits in the system tray, using almost no CPU, waiting for one of two things: a hotkey press or a tray-menu click.

**2. Hotkey toggles Rage Mode.** Pressing `Ctrl+Shift+R` (or clicking "Activate Rage Mode" in the tray menu) spins up a transparent, borderless, always-on-top window covering the screen. The real desktop stays fully visible underneath — nothing is hidden, paused, or modified.

**3. Rage Mode is active.** Once the overlay is up, it becomes the only thing receiving mouse and keyboard input. A minimal HUD shows the current tool, rage score, and combo. From here the user picks one of two input paths:

- **Mouse & keyboard** — click a tool (Hammer, Drill, Axe, Paintball, Explosion, Black Hole, Eraser, Fire) via number keys 1–8 or the tool bar, then click/hold on the overlay to use it.
- **Webcam gestures** — if enabled, a punch, finger-gun, two-hand explosion, or two-fingers-to-temple gesture fires the equivalent effect without touching the mouse at all.

**4. Effects render, score updates.** Whichever input triggered it, the same effect pipeline runs: cracks, particles, screen shake, sound, and (for persistent tools like Paintball or Fire) damage that stays on screen. The HUD's rage score and combo multiplier update live.

**5. Two ways out.** Pressing `R` clears every visual effect and resets the score to zero, but keeps Rage Mode running so the user can keep going. Pressing `Escape` tears the whole overlay down instantly — effects gone, sounds stopped, input hooks released — and drops the user straight back to state 1, idle in the tray, with the real desktop exactly as it was.

The one constant through every step: the overlay only ever draws pixels on top of the desktop. No click, keystroke, or gesture is ever forwarded to a real window, file, or process underneath.*

### Project Demo
# Video

https://github.com/user-attachments/assets/540a016d-de9c-473f-b346-3dd52f39819e



https://github.com/user-attachments/assets/f9935095-81ff-495a-be86-e6eb6c84e02f



*Explain what the video demonstrates*

# Additional Demos
[Add any extra demo materials/links]

## Team Contributions
- [Aarcha S Nair]: [Designed and built the transparent, borderless, always-on-top overlay shell (Phase 1)
Implemented global hotkey registration and toggle logic (Ctrl+Shift+R)
Built the mouse/keyboard input layer and tool-switching system (number keys 1–8, tool bar)
Handled the tray icon, background process lifecycle, and clean Escape/exit teardown (no leaked windows or input hooks)
Implemented desktop-aware window detection and visual "target window" destruction (Phase 6)]
- [Mishal S]: [Built the particle/damage rendering system: cracks, screen shake, smoke, and per-tool effects (Hammer, Drill, Axe, Paintball, Explosion, Black Hole, Fire)
Designed the rage score, combo multiplier, and achievement system
Integrated webcam-based gesture recognition (punch, finger-gun, two-hand explosion, "mind blown" temple gesture) using local hand-landmark tracking
Built the HUD, settings screen, and overall glassmorphic dark UI styling
Handled audio: sound effects, mute toggle, and per-action cues]


---
Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)



