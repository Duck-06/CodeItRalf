export class InputHandler {
  constructor() {
    this.keys = {};
    this.onEscapePressed = null; // Callback for escape key
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      // Handle Escape key specially for pause
      if (e.key === 'Escape' && this.onEscapePressed) {
        this.onEscapePressed();
        return;
      }
      
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  isKeyPressed(key) {
    return this.keys[key.toLowerCase()] || false;
  }

  reset() {
    this.keys = {};
  }
}
