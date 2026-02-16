# Anti-Gravity Switch: Dojo Chaos

A 2D browser-based fighting game with a unique control-switching mechanic.

## 📁 Project Structure

```
Game/
├── index.html              # Entry point
├── package.json            # Dependencies
├── src/
│   ├── main.js            # Game loop and core logic
│   ├── engine/
│   │   ├── Physics.js     # Physics system
│   │   ├── InputHandler.js # Keyboard input
│   │   └── Renderer.js    # Canvas rendering
│   ├── entities/
│   │   └── Player.js      # Player entity
│   └── systems/
│       └── SwitchTimer.js # Control switch timing
└── assets/                # Place your images here (optional)
```

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v16 or higher)

### Installation

1. Navigate to the project directory:

```bash
cd "d:\Git Uploads\CodeItRalf\Game"
```

2. Install dependencies:

```bash
npm install
```

### Run Locally

Start the development server:

```bash
npm run dev
```

The game will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` folder.

## 🎮 Controls

**Player 1:**

- A → Move left
- D → Move right
- W → Jump
- W (while moving backward) → Dodge
- E → Attack

**Player 2:**

- J → Move left
- L → Move right
- I → Jump
- I (while moving backward) → Dodge
- O → Attack

## 🔄 Core Mechanic

Every **10 seconds**, players switch which character they control.

- The switch interval **reduces by 1 second every 30 seconds**
- Minimum interval: **5 seconds**
- If YOUR controlled character dies, YOU lose
- First to eliminate the opponent's character wins

## 🥊 Combat Rules

- Each character has **15 HP**
- Each hit deals **1 damage**
- Attack has **300ms cooldown**
- Attacks create a hitbox in front of the player
- Hitting an opponent causes knockback
- Health bar shakes and character flashes red when hit

## 🎯 Game Features

- ✅ Custom physics engine
- ✅ Gravity and collision detection
- ✅ Health system with visual feedback
- ✅ Attack hitboxes with cooldown
- ✅ Dodge mechanic
- ✅ Dynamic control switching
- ✅ Win/loss detection
- ✅ Real-time UI updates

## 🛠️ Tech Stack

- **Vite** - Build tool
- **Vanilla JavaScript** - Game logic
- **HTML5 Canvas** - Rendering
- **Custom Physics Engine** - No external dependencies

## 📝 Notes

- Game starts immediately (no menus)
- Refresh page to restart after game over
- All code is modular and easy to extend
- Ready for hackathon presentation

---

Made with ⚡ Vite + 🎨 Canvas
