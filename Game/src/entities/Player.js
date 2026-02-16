import { Vector2, Physics } from '../engine/Physics.js';

export class Player {
  constructor(x, y, color, controls) {
    this.position = new Vector2(x, y);
    this.velocity = new Vector2(0, 0);
    this.width = 70;  // Increased from 50
    this.height = 120; // Increased from 80
    this.color = color;
    this.controls = controls;
    
    // Combat
    this.health = 15;
    this.maxHealth = 15;
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.attackDuration = 0;
    this.attackHitbox = null;
    this.hasHitThisAttack = false;
    
    // Visual effects
    this.hitFlashTimer = 0;
    this.healthBarShake = 0;
    
    // Movement settings
    this.moveSpeed = 6;     // Max speed
    this.acceleration = 1.5; // High acceleration for responsiveness
    this.friction = 0.8;    // Strong friction for quick stops
    this.jumpPower = 22;
    this.dodgeSpeed = 12;
    this.airControl = 0.7; 
    
    this.isGrounded = false;
    this.facingRight = true;
    
    this.isDodging = false;
    this.dodgeDuration = 0;
  }

  update(input, deltaTime) {
    this.isGrounded = false;
    
    // Update timers
    if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
    if (this.attackDuration > 0) this.attackDuration -= deltaTime;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= deltaTime;
    if (this.healthBarShake > 0) this.healthBarShake -= deltaTime;
    if (this.dodgeDuration > 0) this.dodgeDuration -= deltaTime;
    
    // Attack state
    if (this.attackDuration <= 0) {
      this.isAttacking = false;
      this.attackHitbox = null;
      this.hasHitThisAttack = false;
    }
    if (this.dodgeDuration <= 0) {
      this.isDodging = false;
    }
    
    // PHYSICS UPDATE STEP
    Physics.applyGravity(this);
    
    // Note: We handle horizontal friction in handleInput for direct control
    // But we keep Physics.applyFriction for general damping if needed,
    // though we will override X velocity manually for tightness.
    
    this.position.add(this.velocity);
    Physics.checkGroundCollisions(this);
  }

  handleInput(input, currentControls) {
    if (this.isDodging) return;
    
    const keys = currentControls || this.controls;
    const { left, right, jump, attack } = keys;
    
    // Horizontal Movement Logic
    const isLeft = input.isKeyPressed(left);
    const isRight = input.isKeyPressed(right);
    
    // Apply Acceleration
    if (isLeft) {
      this.velocity.x -= this.acceleration;
      this.facingRight = false;
    } 
    else if (isRight) {
      this.velocity.x += this.acceleration;
      this.facingRight = true;
    } 
    else {
      // Apply Friction when no input
      // Only on ground for tight stopping, air friction is lower (drag)
      if (this.isGrounded) {
        this.velocity.x *= this.friction;
        
        // Snap to 0 if slow enough to stop sliding
        if (Math.abs(this.velocity.x) < 0.1) {
            this.velocity.x = 0;
        }
      } else {
        // Air resistance
        this.velocity.x *= 0.95;
      }
    }

    // Clamp Velocity to Max Speed
    if (this.velocity.x > this.moveSpeed) this.velocity.x = this.moveSpeed;
    if (this.velocity.x < -this.moveSpeed) this.velocity.x = -this.moveSpeed;
    
    // Jump
    if (input.isKeyPressed(jump)) {
      if (this.isGrounded) {
         this.velocity.y = -this.jumpPower;
         this.isGrounded = false;
      }
    }
    
    // Attack
    if (input.isKeyPressed(attack)) {
      this.attack();
    }
  }

  dodge() {
    if (this.dodgeDuration > 0) return;
    this.isDodging = true;
    this.dodgeDuration = 300; 
    const dodgeDirection = this.facingRight ? -1 : 1;
    this.velocity.x = dodgeDirection * this.dodgeSpeed;
  }

  attack() {
    if (this.attackCooldown > 0 || this.isAttacking) return;
    this.isAttacking = true;
    this.attackCooldown = 300; 
    this.attackDuration = 150; 
    this.hasHitThisAttack = false;
    
    const hitboxWidth = 60; // Slightly larger attack range
    const hitboxHeight = 80; // Higher vertical reach
    const hitboxX = this.facingRight ? 
      this.position.x + this.width : 
      this.position.x - hitboxWidth;
    
    this.attackHitbox = {
      x: hitboxX,
      y: this.position.y + 20, // Adjusted Y offset for taller character
      width: hitboxWidth,
      height: hitboxHeight
    };
  }

  checkAttackHit(otherPlayer) {
    if (!otherPlayer.isGrounded) return false;
    if (!this.isAttacking || !this.attackHitbox || this.hasHitThisAttack) return false;
    
    const hit = (
      this.attackHitbox.x < otherPlayer.position.x + otherPlayer.width &&
      this.attackHitbox.x + this.attackHitbox.width > otherPlayer.position.x &&
      this.attackHitbox.y < otherPlayer.position.y + otherPlayer.height &&
      this.attackHitbox.y + this.attackHitbox.height > otherPlayer.position.y
    );
    
    if (hit) {
      this.hasHitThisAttack = true;
      return true;
    }
    return false;
  }

  takeDamage(damage, knockbackDirection) {
    this.health -= damage;
    if (this.health < 0) this.health = 0;
    this.hitFlashTimer = 100;
    this.healthBarShake = 200;
    this.velocity.x = knockbackDirection * 8;
    this.velocity.y = -5;
  }

  isDead() {
    return this.health <= 0;
  }
}
