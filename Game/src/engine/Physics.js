export class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  copy() {
    return new Vector2(this.x, this.y);
  }
}

export class Physics {
  static GRAVITY = 0.8;
  static GROUND_Y = 620; // 720 - 100
  static FRICTION = 0.85;

  static applyGravity(entity) {
    // Only apply force here
    entity.velocity.y += this.GRAVITY;
  }

  static checkGroundCollisions(entity) {
    // Check if passed through floor
    const bottom = entity.position.y + entity.height;
    
    if (bottom >= this.GROUND_Y) {
      // Snap to ground
      entity.position.y = this.GROUND_Y - entity.height;
      entity.velocity.y = 0;
      entity.isGrounded = true;
    } else {
      entity.isGrounded = false;
    }
  }

  static applyFriction(entity) {
    // We handle horizontal friction in Player.js for improved control
  }

  static checkBounds(entity, width) {
    if (entity.position.x < 0) {
      entity.position.x = 0;
      entity.velocity.x = 0;
    }
    if (entity.position.x + entity.width > width) {
      entity.position.x = width - entity.width;
      entity.velocity.x = 0;
    }
  }

  static checkCollision(entity1, entity2) {
    return (
      entity1.position.x < entity2.position.x + entity2.width &&
      entity1.position.x + entity1.width > entity2.position.x &&
      entity1.position.y < entity2.position.y + entity2.height &&
      entity1.position.y + entity1.height > entity2.position.y
    );
  }

  static resolveCollision(entity1, entity2) {
    const c1 = entity1.position.x + entity1.width / 2;
    const c2 = entity2.position.x + entity2.width / 2;
    const minDist = (entity1.width + entity2.width) / 2;
    const dist = Math.abs(c1 - c2);
    
    if (dist < minDist) {
      const overlap = minDist - dist;
      const push = overlap / 2;
      
      if (c1 < c2) {
        entity1.position.x -= push;
        entity2.position.x += push;
      } else {
        entity1.position.x += push;
        entity2.position.x -= push;
      }
    }
  }
}
