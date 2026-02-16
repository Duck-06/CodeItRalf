import { InputHandler } from './engine/InputHandler.js';
import { Renderer } from './engine/Renderer.js';
import { Physics } from './engine/Physics.js';
import { Player } from './entities/Player.js';
import { SwitchTimer } from './systems/SwitchTimer.js';
import { UIManager } from './systems/UIManager.js';
import { AudioManager } from './systems/AudioManager.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new Renderer(this.canvas);
    this.input = new InputHandler();
    this.uiManager = new UIManager(this.canvas);
    
    // Initialize Audio Manager
    this.audioManager = new AudioManager(this.uiManager.settings);
    this.audioManager.load('bgm', 'assets/Audio/bg_music.wav', true); // Loop background music
    this.audioManager.load('punch', 'assets/Audio/punch.wav', false); // No loop for punch
    this.audioManager.load('win', 'assets/Audio/game_win.wav', false); // No loop for win
    
    // Assign audio manager to UI for volume control
    this.uiManager.audioManager = this.audioManager;
    
    // Setup name input overlay handlers
    this.setupNameInput();
    
    // Setup pause handler
    this.input.onEscapePressed = () => {
      if (!this.gameOver && this.uiManager.gameState === 'playing') {
        this.uiManager.togglePause();
        this.handleAudioOnPause();
      }
    };
    
    // Setup rematch callback
    this.uiManager.onRematch = () => {
      this.resetMatch();
    };
    
    // Initialize players
    // Initial colors set here, but update() will override them immediately
    this.player1 = new Player(200, 300, '#ff6b6b', {
      left: 'a', right: 'd', jump: 'w', attack: 'e'
    });
    
    this.player2 = new Player(1000, 300, '#2ecc71', {
      left: 'j', right: 'l', jump: 'i', attack: 'o'
    });
    
    // Assign audio manager to players
    this.player1.audioManager = this.audioManager;
    this.player2.audioManager = this.audioManager;
    
    // Control system
    this.controllingPlayer1 = true; // True = Player 1 controls character 1
    this.switchTimer = new SwitchTimer();
    
    // Game state
    this.gameOver = false;
    this.winner = null;
    
    // Audio state
    this.bgmStarted = false;
    this.winMusicPlayed = false;
    
    // Timing
    this.lastTime = performance.now();
    this.deltaTime = 0;
    
    // Start game loop
    this.loop();
  }
  
  setupNameInput() {
    const overlay = document.getElementById('name-input-overlay');
    const startBtn = document.getElementById('start-match-btn');
    const backBtn = document.getElementById('back-btn');
    const p1Input = document.getElementById('player1-name');
    const p2Input = document.getElementById('player2-name');
    
    startBtn.addEventListener('click', () => {
      this.uiManager.player1Name = p1Input.value.trim() || 'Player 1';
      this.uiManager.player2Name = p2Input.value.trim() || 'Player 2';
      this.uiManager.gameState = 'playing';
      overlay.classList.remove('active');
      this.resetMatch();
    });
    
    backBtn.addEventListener('click', () => {
      this.uiManager.gameState = 'menu';
      overlay.classList.remove('active');
    });
  }
  
  resetMatch() {
    // Apply Gameplay Settings
    const maxHP = this.uiManager.settings.maxHealth;
    this.player1.maxHealth = maxHP;
    this.player2.maxHealth = maxHP;
    
    // Reset players
    this.player1.health = maxHP;
    this.player2.health = maxHP;
    this.player1.position.x = 200;
    this.player1.position.y = 300;
    this.player2.position.x = 1000;
    this.player2.position.y = 300;
    this.player1.velocity.x = 0;
    this.player1.velocity.y = 0;
    this.player2.velocity.x = 0;
    this.player2.velocity.y = 0;
    
    // Reset inputs to prevent stuck keys
    this.input.reset();
    
    // Reset game state with settings
    this.controllingPlayer1 = true;
    this.switchTimer = new SwitchTimer(
      this.uiManager.settings.initialSwitchInterval, 
      this.uiManager.settings.intervalReduction
    );
    this.gameOver = false;
    this.winner = null;
    
    // Reset audio state
    this.bgmStarted = false;
    this.winMusicPlayed = false;
    this.audioManager.stopAll(); // Stop all audio before restarting
  }

  loop() {
    const currentTime = performance.now();
    this.deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Handle setup state
    if (this.uiManager.gameState === 'setup') {
      const overlay = document.getElementById('name-input-overlay');
      if (!overlay.classList.contains('active')) {
        overlay.classList.add('active');
      }
    }
    
    // Start BGM when game starts playing
    if (this.uiManager.gameState === 'playing' && !this.gameOver && !this.bgmStarted) {
      this.audioManager.play('bgm');
      this.bgmStarted = true;
    }
    
    // Only update game logic if in playing state and not paused
    if (this.uiManager.gameState === 'playing' && !this.gameOver && !this.uiManager.isPaused) {
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
    const COLOR_B = '#2ecc71'; // Green (Set B Owner)
    
    // Determine Control & Color Ownership
    let controlsForP1, controlsForP2;

    if (this.controllingPlayer1) {
      // Normal State: P1 Entity is Set A (Red), P2 Entity is Set B (Cyan)
      controlsForP1 = inputSetA;
      controlsForP2 = inputSetB;
    } else {
      // Switched State: P1 Entity is Set B (Cyan), P2 Entity is Set A (Red)
      controlsForP1 = inputSetB;
      controlsForP2 = inputSetA;
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
        this.winner = this.controllingPlayer1 ? this.uiManager.player2Name : this.uiManager.player1Name;
      } else {
        this.winner = this.controllingPlayer1 ? this.uiManager.player1Name : this.uiManager.player2Name;
      }
      this.uiManager.winner = this.winner;
      this.uiManager.gameState = 'gameover';
      
      // Handle win music
      if (!this.winMusicPlayed) {
        this.audioManager.stop('bgm'); // Stop background music
        this.audioManager.play('win'); // Play win music once
        this.winMusicPlayed = true;
      }
    }
  }

  handleAudioOnPause() {
    // Toggle BGM based on pause state
    if (this.uiManager.isPaused) {
      this.audioManager.pause('bgm');
    } else {
      this.audioManager.resume('bgm');
    }
  }

  render() {
    this.renderer.render(this, this.uiManager);
  }
}

// Start game when page loads
window.addEventListener('load', () => {
  new Game();
});
