
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
        // Generate a few air boosters (Clouds - Buffs)
        for (let i = 0; i < 2; i++) {
            this.boosters.push({
                x: startX + Math.random() * chunkWidth,
                y: -1000 + Math.random() * (this.groundY + 800), // Much wider vertical range
                type: 'cloud',
                radius: 40,
                color: 'rgba(255, 255, 255, 0.5)'
            });
        }

        // Generate flying obstacles (Birds - Nerfs)
        for (let i = 0; i < 3; i++) {
            this.boosters.push({
                x: startX + Math.random() * chunkWidth,
                y: -1200 + Math.random() * (this.groundY + 1000),
                type: 'bird',
                radius: 25,
                color: '#2d3436'
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
                    this.boosters.splice(i, 1);
                }
            } else if (b.type === 'bird') {
                const dx = penguin.x - b.x;
                const dy = penguin.y - b.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < b.radius + 20) {
                    penguin.vx *= 0.5; // Hits bird, lose speed
                    penguin.vy += 5; // Pushed down
                    this.boosters.splice(i, 1);
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
            } else if (b.type === 'bird') {
                // Draw simple Bird
                this.ctx.fillStyle = b.color;
                this.ctx.beginPath();
                this.ctx.moveTo(sx - 15, sy);
                this.ctx.quadraticCurveTo(sx, sy - 15, sx + 15, sy);
                this.ctx.quadraticCurveTo(sx, sy + 5, sx - 15, sy);
                this.ctx.fill();
                
                // Beak
                this.ctx.fillStyle = '#ff9f43';
                this.ctx.beginPath();
                this.ctx.moveTo(sx + 10, sy);
                this.ctx.lineTo(sx + 20, sy);
                this.ctx.lineTo(sx + 12, sy + 3);
                this.ctx.fill();
            } else {
                this.ctx.fillStyle = b.color;
                this.ctx.fillRect(sx - 30, sy - 10, 60, 10);
                this.ctx.fillStyle = 'white';
                this.ctx.fillRect(sx - 20, sy - 15, 40, 5);
            }
        });
    }
}
