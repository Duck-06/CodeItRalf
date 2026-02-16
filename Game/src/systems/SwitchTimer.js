export class SwitchTimer {
  constructor() {
    this.currentInterval = 10; // Start at 10 seconds
    this.minInterval = 5; // Minimum 5 seconds
    this.timeUntilSwitch = this.currentInterval;
    this.timeUntilReduce = 30; // Reduce interval every 30 seconds
    this.totalGameTime = 0;
    this.showingSwitchAlert = false;
    this.switchAlertDuration = 0;
  }

  update(deltaTime) {
    this.totalGameTime += deltaTime / 1000;
    this.timeUntilSwitch -= deltaTime / 1000;
    this.timeUntilReduce -= deltaTime / 1000;
    
    // Update switch alert
    if (this.switchAlertDuration > 0) {
      this.switchAlertDuration -= deltaTime;
    } else {
      this.showingSwitchAlert = false;
    }
    
    // Check if interval should reduce
    if (this.timeUntilReduce <= 0) {
      if (this.currentInterval > this.minInterval) {
        this.currentInterval -= 1;
      }
      this.timeUntilReduce = 30;
    }
    
    // Check if switch should happen
    if (this.timeUntilSwitch <= 0) {
      this.timeUntilSwitch = this.currentInterval;
      this.showingSwitchAlert = true;
      this.switchAlertDuration = 1000; // Show "SWITCH!" for 1 second
      return true; // Signal that switch occurred
    }
    
    return false;
  }

  getTimeLeft() {
    return Math.max(0, this.timeUntilSwitch);
  }

  getCurrentInterval() {
    return this.currentInterval;
  }

  isShowingAlert() {
    return this.showingSwitchAlert;
  }
}
