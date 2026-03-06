
export class Penguin {
    constructor(ctx) {
        this.ctx = ctx;
        this.reset();
    }

    reset() {
        this.x = 100;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.isLaunched = false;
        this.groundY = window.innerHeight - 100;
        this.width = 40;
        this.height = 25;
        this.color = '#ff6b6b';
        this.trail = [];
    }

    launch(precision) {
        const baseForce = 25;
        const force = baseForce * (1 + precision);
        const angle = -45 * (Math.PI / 180); // Ideal launch angle
        
        this.vx = Math.cos(angle) * force;
        this.vy = Math.sin(angle) * force;
        this.isLaunched = true;
        this.y = this.groundY - 50;
    }

    update(dt, input) {
        if (!this.isLaunched) return;

        // Input controls (A/D or Arrows)
        const rotationSpeed = 3;
        if (input.left) this.angle -= rotationSpeed * dt;
        if (input.right) this.angle += rotationSpeed * dt;

        // Clamp angle (-60 to 60 degrees)
        this.angle = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.angle));

        // Physics Constants
        const gravity = 0.35; 
        const airResistance = 0.002; // Slightly less air resistance for better glide
        const groundFriction = 0.96; // Ice friction (was 0.8)
        
        // Apply Gravity
        this.vy += gravity;

        // Aerodynamic logic
        let liftFactor = 0;
        let dragMultiplier = 1;

        if (this.angle < 0) {
            // Gliding Up: More lift, but costs X speed
            liftFactor = -this.angle * 0.4; // Increased lift factor
            dragMultiplier = 1 + Math.abs(this.angle) * 1.5; // High cost for climbing
        } else {
            // Diving: Gains speed, less lift
            liftFactor = -this.angle * 0.15; 
            dragMultiplier = 1 - (this.angle * 0.4); // Very low drag when diving
        }

        // Apply Lift based on current horizontal speed
        // If enough speed, vy will become negative (climb)
        if (this.vx > 1) { 
            const liftForce = liftFactor * (this.vx * 0.15);
            this.vy -= liftForce;
        }

        // Apply Drag
        this.vx -= this.vx * (airResistance * dragMultiplier);
        this.vy -= this.vy * airResistance;

        // Update Position
        this.x += this.vx;
        this.y += this.vy;

        // Trail
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > 20) this.trail.shift();

        // Check Ground (Bounce and Slide)
        if (this.y > this.groundY) {
            this.y = this.groundY;
            
            // If hitting hard, bounce
            if (this.vy > 2) {
                this.vy = -this.vy * 0.5; // Ricochet (bounciness)
                this.vx *= 0.9; // Lose a bit of speed on impact
            } else {
                // Otherwise, slide on ice
                this.vy = 0;
                this.vx *= groundFriction; 
                this.angle = 0; // Straighten up on ice
            }
            
            // End condition
            if (Math.abs(this.vx) < 0.2) {
                this.vx = 0;
                this.isLaunched = false;
                window.game.endGame();
            }
        }
    }

    draw(cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;

        // Draw Trail
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < this.trail.length; i++) {
            const p = this.trail[i];
            const tx = p.x - cameraX;
            const ty = p.y - cameraY;
            if (i === 0) this.ctx.moveTo(tx, ty);
            else this.ctx.lineTo(tx, ty);
        }
        this.ctx.stroke();

        // Draw Penguin Body (Minimalist Vector)
        this.ctx.save();
        this.ctx.translate(screenX, screenY);
        this.ctx.rotate(this.angle);

        // Body
        this.ctx.fillStyle = '#222'; // Back
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, this.width/2, this.height/2, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'white'; // Belly
        this.ctx.beginPath();
        this.ctx.ellipse(0, 5, this.width/3, this.height/3, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Head
        this.ctx.fillStyle = '#222';
        this.ctx.beginPath();
        this.ctx.arc(this.width/2 - 5, -5, 10, 0, Math.PI * 2);
        this.ctx.fill();

        // Beak
        this.ctx.fillStyle = '#ff9f43';
        this.ctx.beginPath();
        this.ctx.moveTo(this.width/2 + 2, -5);
        this.ctx.lineTo(this.width/2 + 10, -2);
        this.ctx.lineTo(this.width/2 + 2, 0);
        this.ctx.fill();

        this.ctx.restore();
    }
}

export class Yeti {
    constructor(ctx) {
        this.ctx = ctx;
        this.width = 80;
        this.height = 120;
    }

    draw(cameraX, cameraY) {
        const x = 100 - cameraX;
        const y = window.innerHeight - 100 - cameraY;

        // Simple Yeti Shape
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.roundRect(x - 40, y - 100, 80, 100, 20);
        this.ctx.fill();

        // Eyes
        this.ctx.fillStyle = '#00d2ff';
        this.ctx.beginPath();
        this.ctx.arc(x - 15, y - 70, 5, 0, Math.PI * 2);
        this.ctx.arc(x + 15, y - 70, 5, 0, Math.PI * 2);
        this.ctx.fill();

        // Bat
        this.ctx.strokeStyle = '#576574';
        this.ctx.lineWidth = 10;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(x + 20, y - 40);
        this.ctx.lineTo(x + 80, y - 90);
        this.ctx.stroke();
    }
}
