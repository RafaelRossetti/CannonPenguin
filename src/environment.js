
export class Environment {
    constructor(ctx) {
        this.ctx = ctx;
        this.boosters = [];
        this.groundY = window.innerHeight - 100;
        this.lastGeneratedX = 0;
        this.generateDistance = 2000;
    }

    reset() {
        this.boosters = [];
        this.lastGeneratedX = 0;
        this.generateNewChunk(0);
    }

    generateNewChunk(startX) {
        const chunkWidth = 2000;
        // Generate a few air boosters
        for (let i = 0; i < 3; i++) {
            this.boosters.push({
                x: startX + Math.random() * chunkWidth,
                y: 100 + Math.random() * (this.groundY - 300),
                type: 'cloud',
                radius: 40,
                color: 'rgba(255, 255, 255, 0.5)'
            });
        }

        // Generate a few ground boosters
        for (let i = 0; i < 2; i++) {
            this.boosters.push({
                x: startX + Math.random() * chunkWidth,
                y: this.groundY,
                type: 'trampoline',
                width: 60,
                height: 20,
                color: '#00d2ff'
            });
        }

        this.lastGeneratedX = startX + chunkWidth;
    }

    update(penguinX) {
        if (penguinX + this.generateDistance > this.lastGeneratedX) {
            this.generateNewChunk(this.lastGeneratedX);
        }
    }

    checkCollisions(penguin) {
        for (let i = this.boosters.length - 1; i >= 0; i--) {
            const b = this.boosters[i];
            
            if (b.type === 'cloud') {
                const dx = penguin.x - b.x;
                const dy = penguin.y - b.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < b.radius + 20) {
                    penguin.vx += 10;
                    penguin.vy = -5;
                    this.boosters.splice(i, 1); // Consume cloud
                    // Trigger sound/effect here
                }
            } else if (b.type === 'trampoline') {
                if (penguin.x > b.x - 30 && penguin.x < b.x + 30 && 
                    Math.abs(penguin.y - b.y) < 30) {
                    penguin.vy = -15;
                    penguin.vx *= 1.2;
                    // Dont consume trampoline
                }
            }
        }
    }

    draw(cameraX, cameraY) {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Draw Ground
        this.ctx.fillStyle = '#f0f3f5';
        this.ctx.fillRect(0, this.groundY - cameraY, width, height);

        // Draw Snow Detail (simple lines)
        this.ctx.strokeStyle = '#d1d8e0';
        this.ctx.lineWidth = 2;
        for (let x = - (cameraX % 100); x < width; x += 100) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.groundY + 10 - cameraY);
            this.ctx.lineTo(x + 50, this.groundY + 10 - cameraY);
            this.ctx.stroke();
        }

        // Draw Boosters
        this.boosters.forEach(b => {
            const sx = b.x - cameraX;
            const sy = b.y - cameraY;
            if (sx < -100 || sx > width + 100) return;

            if (b.type === 'cloud') {
                this.ctx.fillStyle = b.color;
                this.ctx.beginPath();
                this.ctx.arc(sx, sy, b.radius, 0, Math.PI * 2);
                this.ctx.arc(sx + 20, sy - 10, b.radius * 0.8, 0, Math.PI * 2);
                this.ctx.arc(sx - 20, sy - 10, b.radius * 0.8, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
                this.ctx.font = '20px sans-serif';
                this.ctx.fillText('⚡', sx - 10, sy + 5);
            } else {
                this.ctx.fillStyle = b.color;
                this.ctx.fillRect(sx - 30, sy - 10, 60, 10);
                this.ctx.fillStyle = 'white';
                this.ctx.fillRect(sx - 20, sy - 15, 40, 5);
            }
        });
    }
}
