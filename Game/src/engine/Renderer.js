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
      player1: new Image(),
      player2: new Image()
    };

    this.loadAssets();
  }

  loadAssets() {
    this.images.background.src = 'assets/background/dojo.png';
    // Load static sprites
    this.images.player1.src = 'assets/Player_1/kungfu.png';
    this.images.player2.src = 'assets/Player_2/tailung.png';
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Draws the background image using 'cover' fit (preserves aspect ratio)
   */
  drawBackground() {
    const bg = this.images.background;
    if (bg.complete && bg.naturalWidth !== 0) {
      // Calculate 'cover' dimensions
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
      // Fallback
      this.ctx.fillStyle = '#1a1a1a';
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  drawShadow(x, y, width) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.translate(x + width / 2, y);
    this.ctx.scale(1, 0.3);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, width / 1.5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawPlayer(player, isControlled) {
    this.ctx.save();
    
    // Identify Sprite
    const isPlayer1 = player.color === '#ff6b6b';
    const sprite = isPlayer1 ? this.images.player1 : this.images.player2;

    // Position Calculations
    const x = player.position.x;
    const y = player.position.y;
    const w = player.width;
    const h = player.height;

    // Draw Shadow
    this.drawShadow(x, y + h, w);

    // Glow Effect
    if (isControlled) {
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = isPlayer1 ? '#ff4757' : '#2ed573';
    }

    // Sprite Rendering
    if (sprite && sprite.complete && sprite.naturalWidth !== 0) {
        
        // Setup Flip
        const flip = !player.facingRight;
        
        // Anchor at bottom-center of hitbox
        this.ctx.translate(x + w / 2, y + h);
        this.ctx.scale(flip ? -1 : 1, 1);

        // Calculate aspect ratio scale to fit height
        // We want the character to be roughly aligned with the 50x80 hitbox
        // Usually art has some padding, so we might draw it slightly larger (e.g. 1.5x)
        // But the user asked to "keep the size appropriate".
        // Let's match the height of the hitbox + ~20% for visual flair.
        
        // Note: kungfu.png and tailung.png dimensions are unknown but likely larger than 80px.
        // We will fit-height.
        
        const sW = sprite.naturalWidth;
        const sH = sprite.naturalHeight;
        
        // Target Height: 100px (hitbox 80 + a bit)
        const targetH = 110;
        const scale = targetH / sH;
        const renderW = sW * scale;
        const renderH = sH * scale;

        // Draw centered
        this.ctx.drawImage(sprite, -renderW / 2, -renderH + 7, renderW, renderH); 
        // +7 offset to align feet with shadow slightly better

    } else {
        // Fallback Rectangle
        if (player.hitFlashTimer > 0) {
            this.ctx.fillStyle = '#ff0000';
        } else {
            this.ctx.fillStyle = player.color;
        }
        this.ctx.fillRect(x, y, w, h);
    }
    
    this.ctx.shadowBlur = 0;
    this.ctx.restore();
    
    // Controlled Indicator (Triangle)
    if (isControlled) {
      this.ctx.save();
      this.ctx.fillStyle = '#ffec00';
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      // Triangle above head
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

  drawUI(game) {
    // Health Bars
    this.drawHealthBar(game.player1, 50, 50, 'PLAYER 1');
    this.drawHealthBar(game.player2, this.width - 250, 50, 'PLAYER 2');

    // Timer
    if (!game.gameOver) {
      this.drawTimer(game.switchTimer.getTimeLeft(), game.switchTimer.getCurrentInterval());
    }

    // Switch Alert
    if (game.switchTimer.isShowingAlert()) {
      this.drawSwitchAlert();
    }

    // Controls
    this.drawControls();

    // Winner
    if (game.gameOver && game.winner) {
      this.drawWinner(game.winner);
    }
  }

  drawHealthBar(player, x, y, label) {
    const barWidth = 200;
    const barHeight = 25;

    // Shake
    let offX = 0, offY = 0;
    if (player.healthBarShake > 0) {
      offX = (Math.random() - 0.5) * 6;
      offY = (Math.random() - 0.5) * 6;
    }

    const dx = x + offX;
    const dy = y + offY;

    // Container
    this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this.ctx.fillRect(dx-2, dy-2, barWidth+4, barHeight+4);

    // Bar
    const pct = Math.max(0, player.health / player.maxHealth);
    const w = barWidth * pct;

    // Color based on player
    this.ctx.fillStyle = (player.color === '#ff6b6b') ? '#ff4757' : '#2ed573';
    this.ctx.fillRect(dx, dy, w, barHeight);

    // Text
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.shadowColor = '#000';
    this.ctx.shadowBlur = 4;
    this.ctx.fillText(label, dx, dy - 6);
    this.ctx.shadowBlur = 0;
  }

  drawTimer(timeLeft, interval) {
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 40px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
    this.ctx.shadowBlur = 8;
    this.ctx.fillText(timeLeft.toFixed(1), this.width / 2, 60);
    this.ctx.font = '16px "Segoe UI", sans-serif';
    this.ctx.fillText(`SWITCH INTERVAL: ${interval}s`, this.width / 2, 85);
    this.ctx.shadowBlur = 0;
  }

  drawSwitchAlert() {
    this.ctx.save();
    this.ctx.translate(this.width/2, this.height/2);
    // Pulse effect
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

  drawControls() {
    this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('P1: A/D Move, W Jump, E Attack', 20, this.height - 40);
    this.ctx.fillText('P2: J/L Move, I Jump, O Attack', 20, this.height - 20);
  }

  // Helper method to draw the scene
  render(game) {
    this.clear();
    this.drawBackground();

    const controlled1 = game.controllingPlayer1 ? game.player1 : game.player2;
    const controlled2 = game.controllingPlayer1 ? game.player2 : game.player1;

    // Draw Players
    this.drawPlayer(game.player1, game.player1 === controlled1 || game.player1 === controlled2);
    this.drawPlayer(game.player2, game.player2 === controlled1 || game.player2 === controlled2);

    // Draw UI
    this.drawUI(game);
  }
}
