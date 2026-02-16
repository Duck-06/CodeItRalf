# 🥋 KungFu Chaos

A high-energy local multiplayer 2D fighting game with a chaotic twist!

![Game Banner](assets/background/dojo.png)

## 🎮 Game Overview

**KungFu Chaos** is a 1v1 fighting game where you don't just battle your opponent—you battle for control! Every few seconds, the "Control Switch" mechanic swaps which character you control. One moment you're the Red Panda, the next you're the Green Tai Lung. Adapt quickly or get knocked out!

## ✨ Key Features

- **🔄 Control Switch Mechanic**: Players swap characters at random intervals. The timer on screen counts down to the next switch!
- **🥊 Fast-Paced Combat**: Fluid movement, double jumps, and satisfying punch mechanics.
- **🔊 Dynamic Audio System**:
  - Looping background music
  - Short, crisp sound effects (120ms punch sounds)
  - Win music on game over
  - Real-time volume control
- **🎨 Premium UI**:
  - Glass-morphism menus and HUD
  - Urgency-based timer animations (White → Yellow → Red → Pulse)
  - Dedicated "How to Play" screen
- **⚙️ Customizable Settings**:
  - Adjust **Music** and **SFX** volume
  - Change **Initial Switch Interval** (5s - 30s)
  - Set **Interval Reduction** (0s - 5s)
  - Modify **Max Health** (10 - 50 HP)

## 🕹️ Controls

| Action         | **Player 1** (Blue/Left) | **Player 2** (Green/Right) |
| :------------- | :----------------------: | :------------------------: |
| **Move Left**  |           `A`            |            `J`             |
| **Move Right** |           `D`            |            `L`             |
| **Jump**       |           `W`            |            `I`             |
| **Attack**     |           `E`            |            `O`             |
| **Pause**      |          `ESC`           |           `ESC`            |

> **PRO TIP:** When the timer hits 0, your controls swap! If you were controlling the Red character, you are now the Green character (and vice-versa). The character you control always has a colored glow matching your player color.

## 🚀 How to Run

1.  **Install Dependencies:**

    ```bash
    npm install
    ```

2.  **Start the Development Server:**

    ```bash
    npm run dev
    ```

3.  **Play:**
    Open your browser and navigate to the local URL (usually `http://localhost:5173` or similar).

## 🛠️ Technical Details

Built with **Vanilla JavaScript** and **HTML5 Canvas**. No external game engines were used.

### File Structure

- `src/main.js` - Game entry point and loop.
- `src/engine/` - Core engine (Renderer, Physics).
- `src/entities/` - Game objects (Player).
- `src/systems/` - Systems (AudioManager, UIManager).

### Recent Updates

- **Audio Overhaul**: Added `AudioManager` for centralized sound control.
- **UI Redesign**: Modernized the HUD with a "sports broadcast" style timer and removed on-screen clutter.
- **Instructions Screen**: Added a dedicated menu to learn controls.
- **Balance Adjustments**: Tuned movement speed and jump height for better feel.

---

_Created by Rudra Amit Tatuskar_
