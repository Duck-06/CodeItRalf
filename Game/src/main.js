import { InputHandler } from './engine/InputHandler.js';
import { Renderer } from './engine/Renderer.js';
import { Physics } from './engine/Physics.js';
import { Player } from './entities/Player.js';
import { SwitchTimer } from './systems/SwitchTimer.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new Renderer(this.canvas);
    this.input = new InputHandler();
    
    // Initialize players
    // Initial colors set here, but update() will override them immediately
    this.player1 = new Player(200, 300, '#ff6b6b', {
      left: 'a', right: 'd', jump: 'w', attack: 'e'
    });
    
    this.player2 = new Player(1000, 300, '#4ecdc4', {
      left: 'j', right: 'l', jump: 'i', attack: 'o'
    });
    
    // Control system
    this.controllingPlayer1 = true; // True = Player 1 controls character 1
    this.switchTimer = new SwitchTimer();
    
    // Game state
    this.gameOver = false;
    this.winner = null;
    
    // Timing
    this.lastTime = performance.now();
    this.deltaTime = 0;
    
    // Start game loop
    this.loop();
  }

  loop() {
    const currentTime = performance.now();
    this.deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    if (!this.gameOver) {
      this.update(this.deltaTime);
    }
    
    this.render();
    
    requestAnimationFrame(() => this.loop());
  }

  update(deltaTime) {
    // Update switch timer
    const shouldSwitch = this.switchTimer.update(deltaTime);
    if (shouldSwitch) {
      this.controllingPlayer1 = !this.controllingPlayer1;
    }
    
    // Explicit Control Sets
    const inputSetA = {
      left: 'a', right: 'd', jump: 'w', attack: 'e'
    };

    const inputSetB = {
      left: 'j', right: 'l', jump: 'i', attack: 'o'
    };

    // Colors
    const COLOR_A = '#ff6b6b'; // Red (Set A Owner)
    const COLOR_B = '#4ecdc4'; // Cyan (Set B Owner)
    
    // Determine Control & Color Ownership
    let controlsForP1, controlsForP2;

    if (this.controllingPlayer1) {
      // Normal State: P1 Entity is Set A (Red), P2 Entity is Set B (Cyan)
      controlsForP1 = inputSetA;
      controlsForP2 = inputSetB;
      
      this.player1.color = COLOR_A;
      this.player2.color = COLOR_B;
    } else {
      // Switched State: P1 Entity is Set B (Cyan), P2 Entity is Set A (Red)
      controlsForP1 = inputSetB;
      controlsForP2 = inputSetA;
      
      this.player1.color = COLOR_B;
      this.player2.color = COLOR_A;
    }
    
    // Handle inputs
    this.player1.handleInput(this.input, controlsForP1);
    this.player2.handleInput(this.input, controlsForP2);
    
    // Update both players state
    this.player1.update(this.input, deltaTime);
    this.player2.update(this.input, deltaTime);
    
    // Check bounds
    Physics.checkBounds(this.player1, this.renderer.width);
    Physics.checkBounds(this.player2, this.renderer.width);
    
    // Player collision
    if (Physics.checkCollision(this.player1, this.player2)) {
      Physics.resolveCollision(this.player1, this.player2);
    }
    
    // Combat
    if (this.player1.checkAttackHit(this.player2)) {
      const knockbackDir = this.player1.facingRight ? 1 : -1;
      this.player2.takeDamage(1, knockbackDir);
    }
    
    if (this.player2.checkAttackHit(this.player1)) {
      const knockbackDir = this.player2.facingRight ? 1 : -1;
      this.player1.takeDamage(1, knockbackDir);
    }
    
    // Check win condition
    if (this.player1.isDead() || this.player2.isDead()) {
      this.gameOver = true;
      if (this.player1.isDead()) {
        this.winner = this.controllingPlayer1 ? 'PLAYER 2' : 'PLAYER 1';
      } else {
        this.winner = this.controllingPlayer1 ? 'PLAYER 1' : 'PLAYER 2';
      }
    }
  }

  render() {
    this.renderer.render(this);
  }
}

// Start game when page loads
window.addEventListener('load', () => {
  new Game();
});
