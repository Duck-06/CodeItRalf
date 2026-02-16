export class UIManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.isPaused = false;
    this.currentMenu = null; // null, 'pause', 'settings'
    
    // Game State Management
    this.gameState = 'menu'; // 'menu', 'setup', 'playing', 'paused', 'gameover'
    
    // Player Names
    this.player1Name = 'Player 1';
    this.player2Name = 'Player 2';
    this.winner = null;
    
    // Audio Manager (will be set by Game)
    this.audioManager = null;
    
    // Settings
    this.settings = {
      musicVolume: 0.5,
      sfxVolume: 0.7,
      screenShake: true,
      showSwitchTimer: true,
      // New Gameplay Settings
      initialSwitchInterval: 10, // seconds
      intervalReduction: 2,      // seconds
      maxHealth: 15              // HP
    };
    
    // Mouse state
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.isDragging = false;
    this.activeSlider = null;
    
    // Buttons
    this.buttons = [];
    
    // UI Assets
    this.uiImages = {
      menuBg: new Image(),
      nextMenuBg: new Image() // For cross-fading
    };
    
    // Background Rotation
    this.backgrounds = [
      'Forest_1.png', 'Forest_2.png', 'Forest_3.png', 'Forest_4.png',
      'Forest_5.png', 'Forest_6.png', 'Forest_7.png', 'Forest_8.png',
      'Nature_1.png', 'Nature_2.png', 'Nature_3.png', 'Nature_4.png',
      'Nature_5.png', 'Nature_6.png', 'Nature_7.png', 'Nature_8.png'
    ];
    this.currentBgIndex = 0;
    this.uiImages.menuBg.src = 'assets/background/' + this.backgrounds[this.currentBgIndex];
    
    this.isTransitioning = false;
    this.transitionAlpha = 0;
    
    // Rotate background every 10 seconds
    setInterval(() => {
      if (!this.isTransitioning) {
        // Start transition to next background
        const nextIndex = (this.currentBgIndex + 1) % this.backgrounds.length;
        this.uiImages.nextMenuBg.src = 'assets/background/' + this.backgrounds[nextIndex];
        this.currentBgIndex = nextIndex;
        this.isTransitioning = true;
        this.transitionAlpha = 0;
      }
    }, 10000);
    
    this.setupMouseListeners();
  }
  
  setupMouseListeners() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      
      // Handle slider dragging
      if (this.isDragging && this.activeSlider) {
        this.updateSliderValue(this.activeSlider);
      }
    });
    
    this.canvas.addEventListener('mousedown', (e) => {
      this.mouseDown = true;
      
      // Check if clicking on a slider
      const slider = this.buttons.find(btn => 
        btn.type === 'slider' && this.isPointInButton(this.mouseX, this.mouseY, btn)
      );
      
      if (slider) {
        this.isDragging = true;
        this.activeSlider = slider;
        this.updateSliderValue(slider);
      } else {
        // Handle other button clicks
        this.handleClick();
      }
    });
    
    this.canvas.addEventListener('mouseup', () => {
      this.mouseDown = false;
      this.isDragging = false;
      this.activeSlider = null;
    });
  }
  
  updateSliderValue(slider) {
    const relativeX = this.mouseX - slider.x;
    const ratio = Math.max(0, Math.min(1, relativeX / slider.width));
    
    // Update the appropriate setting based on the slider label
    if (slider.label === 'Music Volume') {
      this.settings.musicVolume = ratio;
      slider.value = ratio;
      // Update BGM volume in real-time
      if (this.audioManager) {
        this.audioManager.updateVolume('music', ratio);
      }
    } else if (slider.label === 'SFX Volume') {
      this.settings.sfxVolume = ratio;
      slider.value = ratio;
      // SFX volume will be applied on next play
      if (this.audioManager) {
        this.audioManager.updateVolume('sfx', ratio);
      }
    } else if (slider.gameplay === 'initialTimer') {
      // Map 0-1 to 5-30
      this.settings.initialSwitchInterval = Math.round(5 + ratio * 25);
      slider.value = ratio;
      slider.label = 'Initial Timer: ' + this.settings.initialSwitchInterval + 's';
    } else if (slider.gameplay === 'reduction') {
      // Map 0-1 to 0-5
      this.settings.intervalReduction = Math.round(ratio * 5);
      slider.value = ratio;
      slider.label = 'Timer Reduction: ' + this.settings.intervalReduction + 's';
    } else if (slider.gameplay === 'maxHealth') {
      // Map 0-1 to 10-50
      this.settings.maxHealth = Math.round(10 + ratio * 40);
      slider.value = ratio;
      slider.label = 'Max Health: ' + this.settings.maxHealth;
    }
  }
  
  togglePause() {
    this.isPaused = !this.isPaused;
    this.currentMenu = this.isPaused ? 'pause' : null;
  }
  
  handleClick() {
    for (const button of this.buttons) {
      if (this.isPointInButton(this.mouseX, this.mouseY, button)) {
        button.onClick();
        break;
      }
    }
  }
  
  isPointInButton(x, y, button) {
    return x >= button.x && x <= button.x + button.width &&
           y >= button.y && y <= button.y + button.height;
  }
  
  isButtonHovered(button) {
    return this.isPointInButton(this.mouseX, this.mouseY, button);
  }
  
  getPauseButtons(canvasWidth, canvasHeight) {
    const centerX = canvasWidth / 2;
    // Adjusted Y to fit new panel layout
    const startY = canvasHeight / 2 - 50; 
    const buttonWidth = 200;
    const buttonHeight = 50;
    const spacing = 70;
    
    return [
      {
        x: centerX - buttonWidth / 2,
        y: startY,
        width: buttonWidth,
        height: buttonHeight,
        text: 'Resume',
        onClick: () => {
          this.isPaused = false;
          this.currentMenu = null;
        }
      },
      {
        x: centerX - buttonWidth / 2,
        y: startY + spacing,
        width: buttonWidth,
        height: buttonHeight,
        text: 'Settings',
        onClick: () => {
          this.currentMenu = 'settings';
        }
      },
      {
        x: centerX - buttonWidth / 2,
        y: startY + spacing * 2,
        width: buttonWidth,
        height: buttonHeight,
        text: 'Restart',
        onClick: () => {
          window.location.reload();
        }
      }
    ];
  }
  
  getSettingsButtons(canvasWidth, canvasHeight) {
    const centerX = canvasWidth / 2;
    // Adjusted startY for more items
    const startY = canvasHeight / 2 - 240; 
    const sliderWidth = 300;
    const sliderHeight = 20;
    const spacing = 65; // Reduced spacing to fit more items
    
    const buttons = [];
    
    // Music Volume Slider
    buttons.push({
      type: 'slider',
      x: centerX - sliderWidth / 2,
      y: startY,
      width: sliderWidth,
      height: sliderHeight,
      label: 'Music Volume',
      value: this.settings.musicVolume,
      onClick: () => {
        const relativeX = this.mouseX - (centerX - sliderWidth / 2);
        this.settings.musicVolume = Math.max(0, Math.min(1, relativeX / sliderWidth));
      }
    });
    
    // SFX Volume Slider
    buttons.push({
      type: 'slider',
      x: centerX - sliderWidth / 2,
      y: startY + spacing,
      width: sliderWidth,
      height: sliderHeight,
      label: 'SFX Volume',
      value: this.settings.sfxVolume,
      onClick: () => {
        const relativeX = this.mouseX - (centerX - sliderWidth / 2);
        this.settings.sfxVolume = Math.max(0, Math.min(1, relativeX / sliderWidth));
      }
    });
    
    // Initial Switch Time (5s to 30s)
    buttons.push({
      type: 'slider',
      gameplay: 'initialTimer',
      x: centerX - sliderWidth / 2,
      y: startY + spacing * 2,
      width: sliderWidth,
      height: sliderHeight,
      label: 'Initial Timer: ' + this.settings.initialSwitchInterval + 's',
      value: (this.settings.initialSwitchInterval - 5) / 25, // Normalize 5-30 to 0-1
      onClick: () => {
        const relativeX = this.mouseX - (centerX - sliderWidth / 2);
        const ratio = Math.max(0, Math.min(1, relativeX / sliderWidth));
        // Map 0-1 back to 5-30
        this.settings.initialSwitchInterval = Math.round(5 + ratio * 25);
      }
    });
    
    // Timer Reduction (0s to 5s)
    buttons.push({
      type: 'slider',
      gameplay: 'reduction',
      x: centerX - sliderWidth / 2,
      y: startY + spacing * 3,
      width: sliderWidth,
      height: sliderHeight,
      label: 'Timer Reduction: ' + this.settings.intervalReduction + 's',
      value: this.settings.intervalReduction / 5, // Normalize 0-5 to 0-1
      onClick: () => {
        const relativeX = this.mouseX - (centerX - sliderWidth / 2);
        const ratio = Math.max(0, Math.min(1, relativeX / sliderWidth));
        // Map 0-1 back to 0-5
        this.settings.intervalReduction = Math.round(ratio * 5);
      }
    });
    
    // Max Health (10 to 50)
    buttons.push({
      type: 'slider',
      gameplay: 'maxHealth',
      x: centerX - sliderWidth / 2,
      y: startY + spacing * 4,
      width: sliderWidth,
      height: sliderHeight,
      label: 'Max Health: ' + this.settings.maxHealth,
      value: (this.settings.maxHealth - 10) / 40, // Normalize 10-50 to 0-1
      onClick: () => {
        const relativeX = this.mouseX - (centerX - sliderWidth / 2);
        const ratio = Math.max(0, Math.min(1, relativeX / sliderWidth));
        // Map 0-1 back to 10-50
        this.settings.maxHealth = Math.round(10 + ratio * 40);
      }
    });
    
    // Screen Shake Toggle
    buttons.push({
      type: 'toggle',
      x: centerX - 150,
      y: startY + spacing * 5 + 10,
      width: 300,
      height: 40,
      label: 'Screen Shake',
      value: this.settings.screenShake,
      onClick: () => {
        this.settings.screenShake = !this.settings.screenShake;
      }
    });
    
    // Switch Timer Toggle
    buttons.push({
      type: 'toggle',
      x: centerX - 150,
      y: startY + spacing * 6 + 10,
      width: 300,
      height: 40,
      label: 'Show Switch Timer',
      value: this.settings.showSwitchTimer,
      onClick: () => {
        this.settings.showSwitchTimer = !this.settings.showSwitchTimer;
      }
    });
    
    // Back Button
    buttons.push({
      type: 'button',
      x: centerX - 100,
      y: startY + spacing * 7 + 25,
      width: 200,
      height: 50,
      text: 'Back',
      onClick: () => {
        this.currentMenu = 'pause';
      }
    });
    
    return buttons;
  }
  
  renderPauseMenu(ctx, canvasWidth, canvasHeight) {
    // Semi-transparent overlay to dim the game
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Glass Panel Dimensions
    const panelW = 400;
    const panelH = 500;
    const panelX = (canvasWidth - panelW) / 2;
    const panelY = (canvasHeight - panelH) / 2;
    
    // Draw Panel Background
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = 'rgba(20, 25, 30, 0.9)'; // Dark blue-grey panel
    this.drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 20);
    ctx.fill();
    
    // Panel Border
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#3498db'; // Bright blue border
    ctx.stroke();
    ctx.restore();
    
    // "PAUSED" text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 50px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(52, 152, 219, 0.5)';
    ctx.shadowBlur = 15;
    ctx.fillText('PAUSED', canvasWidth / 2, panelY + 80);
    ctx.shadowBlur = 0;
    
    // Decorative line under title
    ctx.beginPath();
    ctx.moveTo(canvasWidth/2 - 50, panelY + 100);
    ctx.lineTo(canvasWidth/2 + 50, panelY + 100);
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Update button positions to be relative to panel
    // (We need to recalculate them because they were centered on screen previously)
    // Actually getPauseButtons already centers them X-wise. Y-wise needs adjustment.
    // The previous getPauseButtons logic used `canvasHeight / 2 + 50` which is roughly center.
    // Let's rely on the existing button logic but maybe tweak spacing if needed.
    // For now, the buttons render on top anyway.
    
    // Buttons
    this.buttons = this.getPauseButtons(canvasWidth, canvasHeight);
    this.renderButtons(ctx);
  }
  
  renderSettingsMenu(ctx, canvasWidth, canvasHeight) {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Glass Panel
    const panelW = 500;
    const panelH = 600;
    const panelX = (canvasWidth - panelW) / 2;
    const panelY = (canvasHeight - panelH) / 2;
    
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = 'rgba(20, 25, 30, 0.95)';
    this.drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 20);
    ctx.fill();
    ctx.strokeStyle = '#2ecc71'; // Green accent for settings
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    
    // "SETTINGS" text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 50px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(46, 204, 113, 0.5)';
    ctx.shadowBlur = 15;
    ctx.fillText('SETTINGS', canvasWidth / 2, panelY + 60);
    ctx.shadowBlur = 0;
    
    // Decorative line
    ctx.beginPath();
    ctx.moveTo(canvasWidth/2 - 60, panelY + 80);
    ctx.lineTo(canvasWidth/2 + 60, panelY + 80);
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Buttons
    this.buttons = this.getSettingsButtons(canvasWidth, canvasHeight);
    this.renderSettingsControls(ctx);
  }
  
  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  renderButtons(ctx) {
    for (const button of this.buttons) {
      const isHovered = this.isButtonHovered(button);
      
      ctx.save();
      
      // Shadow / Glow
      if (isHovered) {
        ctx.shadowColor = '#2ecc71';
        ctx.shadowBlur = 15;
      } else {
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 5;
      }
      
      // Background Gradient
      const gradient = ctx.createLinearGradient(button.x, button.y, button.x, button.y + button.height);
      if (isHovered) {
        gradient.addColorStop(0, '#2ecc71'); // Bright Green top
        gradient.addColorStop(1, '#27ae60'); // Dark Green bottom
      } else {
        gradient.addColorStop(0, 'rgba(44, 62, 80, 0.9)'); // Dark Blue-Grey top
        gradient.addColorStop(1, 'rgba(34, 49, 63, 0.95)'); // Darker bottom
      }
      
      ctx.fillStyle = gradient;
      this.drawRoundedRect(ctx, button.x, button.y, button.width, button.height, 10);
      ctx.fill();
      
      // Border
      ctx.lineWidth = 2;
      ctx.strokeStyle = isHovered ? '#fff' : '#4a90e2'; // White on hover, blue normally
      ctx.stroke();
      
      // Text
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      // Adjust font size slightly
      ctx.font = 'bold 22px "Segoe UI", sans-serif'; 
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(button.text, button.x + button.width / 2, button.y + button.height / 2);
      
      ctx.restore();
    }
  }
  
  renderSettingsControls(ctx) {
    for (const control of this.buttons) {
      if (control.type === 'slider') {
        ctx.save();
        this.renderSlider(ctx, control);
        ctx.restore();
      } else if (control.type === 'toggle') {
        ctx.save();
        this.renderToggle(ctx, control);
        ctx.restore();
      } else if (control.type === 'button') {
        // Reuse the aesthetic button rendering logic
        const isHovered = this.isButtonHovered(control);
        ctx.save();
        
        // Shadow / Glow
        if (isHovered) {
          ctx.shadowColor = '#2ecc71';
          ctx.shadowBlur = 15;
        } else {
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 5;
        }
        
        // Gradient
        const gradient = ctx.createLinearGradient(control.x, control.y, control.x, control.y + control.height);
        if (isHovered) {
          gradient.addColorStop(0, '#2ecc71');
          gradient.addColorStop(1, '#27ae60');
        } else {
          gradient.addColorStop(0, 'rgba(44, 62, 80, 0.9)');
          gradient.addColorStop(1, 'rgba(34, 49, 63, 0.95)');
        }
        
        ctx.fillStyle = gradient;
        this.drawRoundedRect(ctx, control.x, control.y, control.width, control.height, 10);
        ctx.fill();
        
        // Border
        ctx.lineWidth = 2;
        ctx.strokeStyle = isHovered ? '#fff' : '#4a90e2';
        ctx.stroke();
        
        // Text
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 22px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(control.text, control.x + control.width / 2, control.y + control.height / 2);
        
        ctx.restore();
      }
    }
  }
  
  renderSlider(ctx, slider) {
    // Update value from settings
    if (slider.label === 'Music Volume') {
      slider.value = this.settings.musicVolume;
    } else if (slider.label === 'SFX Volume') {
      slider.value = this.settings.sfxVolume;
    } else if (slider.gameplay === 'initialTimer') {
      slider.value = (this.settings.initialSwitchInterval - 5) / 25;
      slider.label = 'Initial Timer: ' + this.settings.initialSwitchInterval + 's';
    } else if (slider.gameplay === 'reduction') {
      slider.value = this.settings.intervalReduction / 5;
      slider.label = 'Timer Reduction: ' + this.settings.intervalReduction + 's';
    } else if (slider.gameplay === 'maxHealth') {
      slider.value = (this.settings.maxHealth - 10) / 40;
      slider.label = 'Max Health: ' + this.settings.maxHealth;
    }
    
    const isHovered = this.isButtonHovered(slider);
    
    // Label
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ccc';
    ctx.font = '18px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(slider.label, slider.x, slider.y - 12);
    
    // Slider track (Background)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.drawRoundedRect(ctx, slider.x, slider.y, slider.width, slider.height, 10);
    ctx.fill();
    
    // Slider fill (Progress)
    const fillWidth = Math.max(10, slider.width * slider.value);
    
    // Gradient fill
    const gradient = ctx.createLinearGradient(slider.x, 0, slider.x + slider.width, 0);
    gradient.addColorStop(0, '#2ecc71');
    gradient.addColorStop(1, '#27ae60');
    ctx.fillStyle = gradient;
    
    // Draw rounded progress bar
    this.drawRoundedRect(ctx, slider.x, slider.y, fillWidth, slider.height, 10);
    ctx.fill();
    
    // Handle (Knob)
    const knobX = slider.x + fillWidth;
    const knobY = slider.y + slider.height / 2;
    
    ctx.shadowColor = 'rgba(46, 204, 113, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(knobX, knobY, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Value text
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(slider.value * 100) + '%', slider.x + slider.width + 50, slider.y + slider.height / 2);
  }
  
  renderToggle(ctx, toggle) {
    // Update value from settings
    if (toggle.label === 'Screen Shake') toggle.value = this.settings.screenShake;
    if (toggle.label === 'Show Switch Timer') toggle.value = this.settings.showSwitchTimer;
    
    const isHovered = this.isButtonHovered(toggle);
    
    // Background container (subtle)
    if (isHovered) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      this.drawRoundedRect(ctx, toggle.x, toggle.y, toggle.width, toggle.height, 10);
      ctx.fill();
    }
    
    // Label
    ctx.fillStyle = '#fff';
    ctx.font = '20px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(toggle.label, toggle.x + 10, toggle.y + toggle.height / 2);
    
    // Toggle switch structure
    const switchWidth = 60;
    const switchHeight = 30;
    const switchX = toggle.x + toggle.width - switchWidth - 10;
    const switchY = toggle.y + (toggle.height - switchHeight) / 2;
    
    // Track
    ctx.fillStyle = toggle.value ? 'rgba(46, 204, 113, 0.5)' : 'rgba(231, 76, 60, 0.5)';
    this.drawRoundedRect(ctx, switchX, switchY, switchWidth, switchHeight, 15);
    ctx.fill();
    
    // Knob - position based on toggle state
    const knobX = toggle.value ? (switchX + switchWidth - 14) : (switchX + 14);
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(knobX, switchY + switchHeight / 2, 14, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset baseline
    ctx.textBaseline = 'alphabetic';
  }
  
  getSettingsButtons(canvasWidth, canvasHeight) {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    // Layout Constants
    const panelH = 600;
    const panelY = (canvasHeight - panelH) / 2;
    const startY = panelY + 160;
    const spacing = 80;
    const controlWidth = 300;
    const controlHeight = 40;
    
    // Column Centers
    const leftColCenterX = centerX - 220;
    const rightColCenterX = centerX + 220;
    
    const leftX = leftColCenterX - controlWidth / 2;
    const rightX = rightColCenterX - controlWidth / 2;
    
    const buttons = [];
    
    // --- LEFT COLUMN: PREFERENCES ---
    
    // Music Volume Slider
    buttons.push({
      type: 'slider',
      label: 'Music Volume',
      x: leftX,
      y: startY,
      width: controlWidth,
      height: controlHeight,
      value: this.settings.musicVolume,
      onClick: () => {
        const relativeX = this.mouseX - leftX;
        this.settings.musicVolume = Math.max(0, Math.min(1, relativeX / controlWidth));
      }
    });
    
    // SFX Volume Slider
    buttons.push({
      type: 'slider',
      label: 'SFX Volume',
      x: leftX,
      y: startY + spacing,
      width: controlWidth,
      height: controlHeight,
      value: this.settings.sfxVolume,
      onClick: () => {
        const relativeX = this.mouseX - leftX;
        this.settings.sfxVolume = Math.max(0, Math.min(1, relativeX / controlWidth));
      }
    });
    
    // Screen Shake Toggle
    buttons.push({
      type: 'toggle',
      label: 'Screen Shake',
      x: leftX,
      y: startY + spacing * 2 + 10,
      width: controlWidth,
      height: controlHeight,
      value: this.settings.screenShake,
      onClick: () => {
        this.settings.screenShake = !this.settings.screenShake;
      }
    });
    
    // Show Switch Timer Toggle
    buttons.push({
      type: 'toggle',
      label: 'Show Switch Timer',
      x: leftX,
      y: startY + spacing * 3 + 10,
      width: controlWidth,
      height: controlHeight,
      value: this.settings.showSwitchTimer,
      onClick: () => {
        this.settings.showSwitchTimer = !this.settings.showSwitchTimer;
      }
    });

    // --- RIGHT COLUMN: MATCH RULES ---

    // Initial Switch Time (5s to 30s)
    buttons.push({
      type: 'slider',
      gameplay: 'initialTimer',
      x: rightX,
      y: startY,
      width: controlWidth,
      height: controlHeight,
      label: 'Initial Timer: ' + this.settings.initialSwitchInterval + 's',
      value: (this.settings.initialSwitchInterval - 5) / 25, 
      onClick: () => {
        const relativeX = this.mouseX - rightX;
        const ratio = Math.max(0, Math.min(1, relativeX / controlWidth));
        this.settings.initialSwitchInterval = Math.round(5 + ratio * 25);
      }
    });
    
    // Timer Reduction (0s to 5s)
    buttons.push({
      type: 'slider',
      gameplay: 'reduction',
      x: rightX,
      y: startY + spacing,
      width: controlWidth,
      height: controlHeight,
      label: 'Timer Reduction: ' + this.settings.intervalReduction + 's',
      value: this.settings.intervalReduction / 5,
      onClick: () => {
        const relativeX = this.mouseX - rightX;
        const ratio = Math.max(0, Math.min(1, relativeX / controlWidth));
        this.settings.intervalReduction = Math.round(ratio * 5);
      }
    });
    
    // Max Health (10 to 50)
    buttons.push({
      type: 'slider',
      gameplay: 'maxHealth',
      x: rightX,
      y: startY + spacing * 2,
      width: controlWidth,
      height: controlHeight,
      label: 'Max Health: ' + this.settings.maxHealth,
      value: (this.settings.maxHealth - 10) / 40,
      onClick: () => {
        const relativeX = this.mouseX - rightX;
        const ratio = Math.max(0, Math.min(1, relativeX / controlWidth));
        this.settings.maxHealth = Math.round(10 + ratio * 40);
      }
    });

    // --- CENTER: NAVIGATION ---
    
    // Back Button (Centered at bottom of panel)
    buttons.push({
      type: 'button',
      x: centerX - 100,
      y: panelY + panelH - 90, // Positioned relative to bottom of panel
      width: 200,
      height: 50,
      text: 'Back',
      onClick: () => {
        if (this.gameState === 'menu') {
          this.currentMenu = null; // Return to Start Menu
        } else {
          this.currentMenu = 'pause'; // Return to Pause Menu
        }
      }
    });
    
    return buttons;
  }

  renderSettingsMenu(ctx, canvasWidth, canvasHeight) {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Wider Glass Panel for 2-Column Layout
    const panelW = 900;
    const panelH = 600;
    const panelX = (canvasWidth - panelW) / 2;
    const panelY = (canvasHeight - panelH) / 2;
    
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 40;
    ctx.fillStyle = 'rgba(20, 25, 30, 0.95)';
    this.drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 20);
    ctx.fill();
    ctx.strokeStyle = '#2ecc71'; // Green accent
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    
    // "SETTINGS" Title
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 50px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(46, 204, 113, 0.5)';
    ctx.shadowBlur = 20;
    ctx.fillText('SETTINGS', canvasWidth / 2, panelY + 60);
    ctx.restore();
    
    // Decorative line under title
    ctx.beginPath();
    ctx.moveTo(canvasWidth/2 - 60, panelY + 80);
    ctx.lineTo(canvasWidth/2 + 60, panelY + 80);
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Column Headers
    const leftColX = canvasWidth / 2 - 220;
    const rightColX = canvasWidth / 2 + 220;
    
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 24px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Preferences', leftColX, panelY + 130);
    ctx.fillText('Match Rules', rightColX, panelY + 130);
    
    // Render controls
    this.buttons = this.getSettingsButtons(canvasWidth, canvasHeight);
    this.renderSettingsControls(ctx);
  }
  
  // START MENU
  getStartMenuButtons(canvasWidth, canvasHeight) {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const buttonWidth = 250;
    const buttonHeight = 60;
    const spacing = 80;
    
    return [
      {
        x: centerX - buttonWidth / 2,
        y: centerY + 50,
        width: buttonWidth,
        height: buttonHeight,
        text: 'Start Game',
        onClick: () => {
          this.gameState = 'setup';
        }
      },
      {
        x: centerX - buttonWidth / 2,
        y: centerY + 50 + spacing,
        width: buttonWidth,
        height: buttonHeight,
        text: 'Instructions',
        onClick: () => {
          this.currentMenu = 'instructions';
        }
      },
      {
        x: centerX - buttonWidth / 2,
        y: centerY + 50 + spacing * 2,
        width: buttonWidth,
        height: buttonHeight,
        text: 'Settings',
        onClick: () => {
          this.currentMenu = 'settings';
        }
      }
    ];
  }

  drawBackgroundCover(ctx, img, canvasWidth, canvasHeight) {
    if (!img.complete || img.naturalWidth === 0) return;
    
    const bgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = canvasWidth / canvasHeight;
    
    let renderW, renderH, offsetX, offsetY;
    
    if (bgRatio > canvasRatio) {
      renderH = canvasHeight;
      renderW = canvasHeight * bgRatio;
      offsetX = (canvasWidth - renderW) / 2;
      offsetY = 0;
    } else {
      renderW = canvasWidth;
      renderH = canvasWidth / bgRatio;
      offsetX = 0;
      offsetY = (canvasHeight - renderH) / 2;
    }
    
    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
  }
  
  renderStartMenu(ctx, canvasWidth, canvasHeight) {
    // 1. Draw Current Background
    if (this.uiImages.menuBg.complete && this.uiImages.menuBg.naturalWidth !== 0) {
      this.drawBackgroundCover(ctx, this.uiImages.menuBg, canvasWidth, canvasHeight);
    } else {
      // Fallback Gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#0f3460');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
    
    // 2. Handle Transition to Next Background
    if (this.isTransitioning && this.uiImages.nextMenuBg.complete && this.uiImages.nextMenuBg.naturalWidth !== 0) {
        this.transitionAlpha += 0.01; // Fade speed
        
        if (this.transitionAlpha >= 1) {
            this.transitionAlpha = 1;
            this.isTransitioning = false;
            // Complete swap
            this.uiImages.menuBg.src = this.uiImages.nextMenuBg.src;
        }
        
        // Draw next bg on top with alpha
        ctx.save();
        ctx.globalAlpha = this.transitionAlpha;
        this.drawBackgroundCover(ctx, this.uiImages.nextMenuBg, canvasWidth, canvasHeight);
        ctx.restore();
    }
    
    // Dark overlay for readability (always drawn on top)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Game Title
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 90px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
    ctx.shadowBlur = 20;
    // Centered vertically since subtitle is gone
    ctx.fillText('KUNGFU CHAOS', canvasWidth / 2, canvasHeight / 2 - 80);
    
    // Buttons
    this.buttons = this.getStartMenuButtons(canvasWidth, canvasHeight);
    this.renderButtons(ctx);
  }
  
  // GAME OVER SCREEN
  getGameOverButtons(canvasWidth, canvasHeight) {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const buttonWidth = 220;
    const buttonHeight = 55;
    const spacing = 75;
    
    return [
      {
        x: centerX - buttonWidth / 2,
        y: centerY + 120,
        width: buttonWidth,
        height: buttonHeight,
        text: 'Rematch',
        onClick: () => {
          this.gameState = 'playing';
          this.winner = null;
          // Signal game to reset
          if (this.onRematch) this.onRematch();
        }
      },
      {
        x: centerX - buttonWidth / 2,
        y: centerY + 120 + spacing,
        width: buttonWidth,
        height: buttonHeight,
        text: 'Main Menu',
        onClick: () => {
          this.gameState = 'menu';
          this.winner = null;
          this.player1Name = 'Player 1';
          this.player2Name = 'Player 2';
        }
      }
    ];
  }
  
  renderGameOver(ctx, canvasWidth, canvasHeight) {
    // Dramatic Radial Gradient Overlay
    const gradient = ctx.createRadialGradient(
      canvasWidth/2, canvasHeight/2, 50, 
      canvasWidth/2, canvasHeight/2, canvasWidth/1.2
    );
    // Center is slightly transparent to see the action behind (if any)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)'); 
    // Edges are very dark
    gradient.addColorStop(1, 'rgba(10, 0, 0, 0.95)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Animated glow effect
    const time = Date.now() / 1000;
    const pulse = 0.5 + Math.sin(time * 2) * 0.2;
    
    // "GAME OVER" text
    ctx.save();
    ctx.shadowColor = '#e74c3c';
    ctx.shadowBlur = 20 * pulse + 10;
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 60px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvasWidth / 2, canvasHeight / 2 - 120);
    ctx.restore();
    
    // Winner text with intense styling
    ctx.save();
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 30 * pulse;
    ctx.fillStyle = '#ffd700'; // Gold
    ctx.font = 'bold 70px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.winner || 'WINNER', canvasWidth / 2, canvasHeight / 2 - 20);
    ctx.restore();
    
    ctx.fillStyle = '#fff';
    ctx.font = '30px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WINS!', canvasWidth / 2, canvasHeight / 2 + 50);
    
    // Buttons (Will use the new aesthetic button style automatically)
    this.buttons = this.getGameOverButtons(canvasWidth, canvasHeight);
    this.renderButtons(ctx);
  }
  
  // INSTRUCTIONS SCREEN
  getInstructionsButtons(canvasWidth, canvasHeight) {
    const centerX = canvasWidth / 2;
    const panelH = 650;
    const panelY = (canvasHeight - panelH) / 2;
    
    return [
      {
        type: 'button',
        x: centerX - 100,
        y: panelY + panelH - 80,
        width: 200,
        height: 50,
        text: 'Back',
        onClick: () => {
          this.currentMenu = null; // Return to Main Menu
        }
      }
    ];
  }
  
  renderInstructionsMenu(ctx, canvasWidth, canvasHeight) {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Glass Panel
    const panelW = 950;
    const panelH = 650;
    const panelX = (canvasWidth - panelW) / 2;
    const panelY = (canvasHeight - panelH) / 2;
    
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 40;
    ctx.fillStyle = 'rgba(20, 25, 30, 0.95)';
    this.drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 20);
    ctx.fill();
    ctx.strokeStyle = '#3498db'; // Blue accent for instructions
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    
    // "HOW TO PLAY" Title
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 50px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(52, 152, 219, 0.5)';
    ctx.shadowBlur = 20;
    ctx.fillText('HOW TO PLAY', canvasWidth / 2, panelY + 60);
    ctx.restore();
    
    // Decorative line under title
    ctx.beginPath();
    ctx.moveTo(canvasWidth/2 - 80, panelY + 80);
    ctx.lineTo(canvasWidth/2 + 80, panelY + 80);
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Calculate column positions - centered and balanced
    const columnWidth = 400;
    const columnGap = 50;
    const leftColX = panelX + (panelW / 2) - columnWidth - (columnGap / 2);
    const rightColX = panelX + (panelW / 2) + (columnGap / 2);
    let currentY = panelY + 130;
    
    // LEFT COLUMN - Player 1 Controls
    ctx.fillStyle = '#3498db';
    ctx.font = 'bold 26px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🎮 Player 1 Controls', leftColX, currentY);
    
    currentY += 50;
    
    const p1Controls = [
      { key: 'W', action: 'Jump' },
      { key: 'A', action: 'Move Left' },
      { key: 'D', action: 'Move Right' },
      { key: 'E', action: 'Attack' }
    ];
    
    const keyBoxWidth = 40;
    const keyBoxHeight = 35;
    const actionTextOffset = 55;
    
    p1Controls.forEach(control => {
      // Key box
      ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
      ctx.fillRect(leftColX, currentY - 25, keyBoxWidth, keyBoxHeight);
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 2;
      ctx.strokeRect(leftColX, currentY - 25, keyBoxWidth, keyBoxHeight);
      
      // Key letter - centered in box
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(control.key, leftColX + keyBoxWidth / 2, currentY - 3);
      
      // Action text - aligned to the left
      ctx.fillStyle = '#ecf0f1';
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(control.action, leftColX + actionTextOffset, currentY);
      
      currentY += 42;
    });
    
    // RIGHT COLUMN - Player 2 Controls
    currentY = panelY + 130;
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 26px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🎮 Player 2 Controls', rightColX, currentY);
    
    currentY += 50;
    
    const p2Controls = [
      { key: 'I', action: 'Jump' },
      { key: 'J', action: 'Move Left' },
      { key: 'L', action: 'Move Right' },
      { key: 'O', action: 'Attack' }
    ];
    
    p2Controls.forEach(control => {
      // Key box
      ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
      ctx.fillRect(rightColX, currentY - 25, keyBoxWidth, keyBoxHeight);
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 2;
      ctx.strokeRect(rightColX, currentY - 25, keyBoxWidth, keyBoxHeight);
      
      // Key letter - centered in box
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(control.key, rightColX + keyBoxWidth / 2, currentY - 3);
      
      // Action text - aligned to the left
      ctx.fillStyle = '#ecf0f1';
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(control.action, rightColX + actionTextOffset, currentY);
      
      currentY += 42;
    });
    
    // GAME MECHANICS SECTION
    currentY = panelY + 340;
    
    // Section divider
    ctx.beginPath();
    ctx.moveTo(panelX + 60, currentY);
    ctx.lineTo(panelX + panelW - 60, currentY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    currentY += 40;
    
    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 28px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚔️ GAME MECHANICS', canvasWidth / 2, currentY);
    
    currentY += 45;
    
    const mechanics = [
      '🔄 CONTROL SWITCH: Controls swap between players every few seconds!',
      '❤️ HEALTH: Damage your opponent to drain their health bar',
      '🎯 OBJECTIVE: Reduce opponent\'s health to zero to win',
      '⏸️ PAUSE: Press ESC during gameplay to pause'
    ];
    
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '18px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    
    mechanics.forEach(mechanic => {
      ctx.fillText(mechanic, canvasWidth / 2, currentY);
      currentY += 34;
    });
    
    // PRO TIP
    currentY += 15;
    const tipBoxWidth = panelW - 180;
    const tipBoxHeight = 55;
    const tipBoxX = panelX + 90;
    
    ctx.save();
    ctx.fillStyle = 'rgba(241, 196, 15, 0.2)';
    this.drawRoundedRect(ctx, tipBoxX, currentY - 10, tipBoxWidth, tipBoxHeight, 8);
    ctx.fill();
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 17px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💡 PRO TIP: Stay alert! Controls switch unexpectedly - adapt quickly to win!', canvasWidth / 2, currentY + 18);
    
    // Render Back Button
    this.buttons = this.getInstructionsButtons(canvasWidth, canvasHeight);
    this.renderSettingsControls(ctx);
  }
  
  render(ctx, canvasWidth, canvasHeight) {
    // 1. Draw Background/Base Screens
    if (this.gameState === 'menu') {
      this.renderStartMenu(ctx, canvasWidth, canvasHeight);
    } else if (this.gameState === 'gameover') {
      this.renderGameOver(ctx, canvasWidth, canvasHeight);
    }
    
    // 2. Draw Overlays (Instructions, Settings, Pause)
    // Instructions can overlap Menu
    if (this.currentMenu === 'instructions') {
      this.renderInstructionsMenu(ctx, canvasWidth, canvasHeight);
    }
    // Settings can overlap Menu or Game
    else if (this.currentMenu === 'settings') {
      this.renderSettingsMenu(ctx, canvasWidth, canvasHeight);
    }
    // Pause only overlaps Game (when not in Menu/Gameover)
    else if (this.isPaused && this.currentMenu === 'pause') {
       this.renderPauseMenu(ctx, canvasWidth, canvasHeight);
    }
  }
}
