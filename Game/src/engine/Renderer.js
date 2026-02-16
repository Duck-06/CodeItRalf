export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 1280;
    this.height = 720;
    
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx.imageSmoothingEnabled = false;

    // Load Assets
    this.images = {
      background: new Image(),
      player1_stance: new Image(),
      player1_kick: new Image(),
      player2_stance: new Image(),
      player2_kick: new Image()
    };

    this.loadAssets();
  }

  loadAssets() {
    this.images.background.src = 'assets/background/dojo.png';
    // Load player sprites with stance and attack animations
    this.images.player1_stance.src = 'assets/Player_1/panda_stance.png';
    this.images.player1_kick.src = 'assets/Player_1/panda_kick.png';
    this.images.player2_stance.src = 'assets/Player_2/tai_stance.png';
    this.images.player2_kick.src = 'assets/Player_2/tai_kick.png';
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawBackground() {
    const bg = this.images.background;
    if (bg.complete && bg.naturalWidth !== 0) {
      const bgRatio = bg.naturalWidth / bg.naturalHeight;
      const canvasRatio = this.width / this.height;
      
      let renderW, renderH, offsetX, offsetY;

      if (bgRatio > canvasRatio) {
        renderH = this.height;
        renderW = this.height * bgRatio;
        offsetX = (this.width - renderW) / 2;
        offsetY = 0;
      } else {
        renderW = this.width;
        renderH = this.width / bgRatio;
        offsetX = 0;
        offsetY = (this.height - renderH) / 2;
      }

      this.ctx.drawImage(bg, offsetX, offsetY, renderW, renderH);
    } else {
      this.ctx.fillStyle = '#1a1a1a';
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  drawShadow(x, y, width) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; // More subtle opacity
    this.ctx.beginPath();
    // Draw an ellipse shadow at ground level
    const centerX = x + width / 2;
    const centerY = y + 5; // Slight offset from ground
    const radiusX = width * 0.8; // Wider shadow for visual balance (width is narrow hitbox)
    const radiusY = 10; // Slightly taller
    this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawPlayer(player, isControlled, assignedColor, playerEntity) {
    this.ctx.save();
    
    // Select sprite based on ENTITY (not color)
    // player1 entity = panda sprites, player2 entity = tai lung sprites
    const isPlayer1Entity = (playerEntity === 'player1');
    
    let sprite;
    if (isPlayer1Entity) {
      sprite = player.isAttacking ? this.images.player1_kick : this.images.player1_stance;
    } else {
      sprite = player.isAttacking ? this.images.player2_kick : this.images.player2_stance;
    }

    // Position Calculations
    const x = player.position.x;
    const y = player.position.y;
    const w = player.width;
    const h = player.height;

    // Draw Shadow
    this.drawShadow(x, y + h, w);

    // Colored Glow/Outline Effect based on assigned color
    this.ctx.shadowBlur = 25;
    this.ctx.shadowColor = assignedColor;
    
    // Draw the sprite multiple times with offset for outline effect
    if (sprite && sprite.complete && sprite.naturalWidth !== 0) {
        const flip = !player.facingRight;
        
        this.ctx.translate(x + w / 2, y + h);
        this.ctx.scale(flip ? -1 : 1, 1);

        const sW = sprite.naturalWidth;
        const sH = sprite.naturalHeight;
        
        // Target Height: Use visual height if available, otherwise hitbox height
        // Add cushion for animation
        const displayHeight = player.visualHeight || h;
        const targetH = displayHeight + 15;
        const scale = targetH / sH;
        const renderW = sW * scale;
        const renderH = sH * scale;

        // Enhanced glow for controlled character
        if (isControlled) {
          this.ctx.shadowBlur = 40;
        }
        
        // Draw the sprite with colored glow
        this.ctx.drawImage(sprite, -renderW / 2, -renderH + 7, renderW, renderH);
    } else {
        // Fallback Rectangle
        if (player.hitFlashTimer > 0) {
            this.ctx.fillStyle = '#ff0000';
        } else {
            this.ctx.fillStyle = assignedColor;
        }
        this.ctx.fillRect(x, y, w, h);
    }
    
    this.ctx.shadowBlur = 0;
    this.ctx.restore();
    
    // Controlled Indicator
    if (isControlled) {
      this.ctx.save();
      this.ctx.fillStyle = '#ffec00';
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      const cx = x + w / 2;
      const cy = y - 20;
      this.ctx.moveTo(cx, cy);
      this.ctx.lineTo(cx - 5, cy - 10);
      this.ctx.lineTo(cx + 5, cy - 10);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  drawUI(game, p1Color, p2Color, uiManager) {
    // Get raw player names from uiManager
    const rawP1Name = uiManager ? uiManager.player1Name : 'Player 1';
    const rawP2Name = uiManager ? uiManager.player2Name : 'Player 2';
    
    // Determine which name goes to which entity based on control state
    let nameForLeftEntity, nameForRightEntity;
    
    if (game.controllingPlayer1) {
      // Normal: P1 controls Left (Red), P2 controls Right (Green)
      nameForLeftEntity = rawP1Name;
      nameForRightEntity = rawP2Name;
    } else {
      // Switched: P2 controls Left (Green), P1 controls Right (Red)
      nameForLeftEntity = rawP2Name;
      nameForRightEntity = rawP1Name;
    }
    
    // Health Bars with assigned names
    this.drawHealthBar(game.player1, 50, 50, nameForLeftEntity, p1Color);
    this.drawHealthBar(game.player2, this.width - 250, 50, nameForRightEntity, p2Color);

    // Timer (only if not paused and setting is enabled)
    if (!game.gameOver && (!uiManager || uiManager.settings.showSwitchTimer)) {
      this.drawTimer(game.switchTimer.getTimeLeft(), game.switchTimer.getCurrentInterval());
    }

    // Switch Alert
    if (game.switchTimer.isShowingAlert()) {
      this.drawSwitchAlert();
    }

    // Controls removed for cleaner UI

    // Winner
    if (game.gameOver && game.winner) {
      this.drawWinner(game.winner);
    }
  }

  drawHealthBar(player, x, y, label, color) {
    const barWidth = 200;
    const barHeight = 25;

    let offX = 0, offY = 0;
    if (player.healthBarShake > 0) {
      offX = (Math.random() - 0.5) * 6;
      offY = (Math.random() - 0.5) * 6;
    }

    const dx = x + offX;
    const dy = y + offY;

    this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this.ctx.fillRect(dx-2, dy-2, barWidth+4, barHeight+4);

    const pct = Math.max(0, player.health / player.maxHealth);
    const w = barWidth * pct;

    this.ctx.fillStyle = (color === '#ff6b6b') ? '#ff4757' : '#2ed573';
    this.ctx.fillRect(dx, dy, w, barHeight);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.shadowColor = '#000';
    this.ctx.shadowBlur = 4;
    this.ctx.fillText(label, dx, dy - 6);
    this.ctx.shadowBlur = 0;
  }

  drawTimer(timeLeft, interval) {
    const time = Math.max(0, timeLeft);
    const centerX = this.width / 2;
    const centerY = 50; // Moved slightly up for better composition
    
    // 1. Urgency Effects
    let color = '#ffffff'; // Default White
    let shadowColor = 'rgba(0,0,0,0.5)';
    let scale = 1.0;
    
    if (time < 2) {
      color = '#e74c3c'; // Red
      shadowColor = 'rgba(231, 76, 60, 0.8)'; // Red Glow
      scale = 1 + Math.sin(Date.now() / 100) * 0.05; // Quick Pulse
    } else if (time < 3) {
      color = '#e74c3c'; // Red
    } else if (time < 5) {
      color = '#f1c40f'; // Yellow
    }
    
    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.scale(scale, scale);
    
    // 2. Background Badge
    const badgeW = 140;
    const badgeH = 70;
    const badgeX = -badgeW / 2;
    const badgeY = -badgeH / 2;
    
    // Draw Glass Badge
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    this.ctx.beginPath();
    this.ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 15);
    this.ctx.fill();
    
    // Badge Border
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.stroke();
    
    // 3. Timer Text
    this.ctx.fillStyle = color;
    this.ctx.font = 'bold 46px "Segoe UI", sans-serif'; // Larger, cleaner font
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Text Shadow
    this.ctx.shadowColor = shadowColor;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 2;
    
    // Draw Time
    this.ctx.fillText(time.toFixed(1), 0, 2); // Slightly updated y-offset for visual center
    
    this.ctx.restore(); // Restore context to draw outside scaled area
    
    // 4. Subtext (Interval Info) - Now enabled and styled
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.font = 'bold 14px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
    this.ctx.shadowBlur = 4;
    // Draw below the badge (centerY + half badge height + padding)
    this.ctx.fillText(`NEXT SWITCH: ${interval}s`, centerX, centerY + 55);
    this.ctx.shadowBlur = 0;
  }

  drawSwitchAlert() {
    this.ctx.save();
    this.ctx.translate(this.width/2, this.height/2);
    const scale = 1 + Math.sin(Date.now() / 100) * 0.1;
    this.ctx.scale(scale, scale);
    
    this.ctx.font = 'bold 80px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#ff9f43';
    this.ctx.shadowColor = '#ff6b6b';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('SWITCH!', 0, 0);
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = '#fff';
    this.ctx.strokeText('SWITCH!', 0, 0);
    this.ctx.restore();
  }

  drawWinner(winner) {
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.ctx.fillStyle = '#feca57';
    this.ctx.font = 'bold 60px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = '#ff9f43';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText(`${winner} WINS!`, this.width / 2, this.height / 2);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px "Segoe UI", sans-serif';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText('Press F5 to Restart', this.width / 2, this.height / 2 + 50);
  }

  // Removed drawControls() as requested for cleaner UI

  // Helper method to draw the scene
  render(game, uiManager) {
    this.clear();
    
    // Always render UI for menu/gameover states
    if (uiManager) {
      if (uiManager.gameState === 'menu' || uiManager.gameState === 'gameover') {
        uiManager.render(this.ctx, this.width, this.height);
        return;
      }
    }
    
    // Render game (for playing and paused states)
    this.drawBackground();

    const controlled1 = game.controllingPlayer1 ? game.player1 : game.player2;
    const controlled2 = game.controllingPlayer1 ? game.player2 : game.player1;

    // Dynamic Color Determination (Swaps on control switch)
    // The color follows the CONTROLLER, not the entity
    // Whoever is controlled by Player 1 (Set A) gets Red
    // Whoever is controlled by Player 2 (Set B) gets Green
    
    let p1Color, p2Color;
    if (game.controllingPlayer1) {
      // Normal: P1 controls entity1 (Red), P2 controls entity2 (Green)
      p1Color = '#ff6b6b'; 
      p2Color = '#2ecc71';
    } else {
      // Switched: P2 controls entity1 (Green), P1 controls entity2 (Red)
      p1Color = '#2ecc71';
      p2Color = '#ff6b6b';
    } 

    // Draw Players with entity identifiers
    this.drawPlayer(game.player1, game.player1 === controlled1 || game.player1 === controlled2, p1Color, 'player1');
    this.drawPlayer(game.player2, game.player2 === controlled1 || game.player2 === controlled2, p2Color, 'player2');

    // Draw UI
    this.drawUI(game, p1Color, p2Color, uiManager);
    
    // Draw Pause/Settings Menu (on top of everything)
    if (uiManager) {
      uiManager.render(this.ctx, this.width, this.height);
    }
  }
}
