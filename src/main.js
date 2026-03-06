
import { Penguin, Yeti } from './game.js';
import { Environment } from './environment.js';

export const STATES = {
    MENU: 'MENU',
    LAUNCH: 'LAUNCH',
    TRAVEL: 'TRAVEL',
    END: 'END'
};

class GameController {
    constructor() {
        this.state = STATES.MENU;
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.record = parseInt(localStorage.getItem('yeti_launch_record')) || 0;
        
        this.screens = {
            menu: document.getElementById('menu-screen'),
            hud: document.getElementById('hud'),
            end: document.getElementById('end-screen'),
            qte: document.getElementById('qte-container')
        };

        this.elements = {
            recordVal: document.getElementById('record-val'),
            distVal: document.getElementById('dist-val'),
            finalDistVal: document.getElementById('final-dist-val'),
            newRecord: document.getElementById('new-record'),
            startBtn: document.getElementById('start-btn'),
            restartBtn: document.getElementById('restart-btn'),
            qteIndicator: document.getElementById('qte-indicator'),
            bgMusic: document.getElementById('bg-music')
        };

        this.input = {
            left: false,
            right: false
        };

        this.cameraX = 0;
        this.cameraY = 0;
        this.lastTime = 0;
        
        // Components
        this.penguin = new Penguin(this.ctx);
        this.yeti = new Yeti(this.ctx);
        this.env = new Environment(this.ctx);

        this.setupListeners();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // QTE State
        this.qtePower = 0;
        this.qteDirection = 1;
        this.qteActive = false;

        this.elements.recordVal.textContent = this.record;
        
        this.loop(0);
    }

    setupListeners() {
        this.elements.startBtn.addEventListener('click', () => this.startLaunch());
        this.elements.restartBtn.addEventListener('click', () => this.startLaunch());
        
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') this.handleAction();
            if (e.code === 'ArrowLeft' || e.key === 'a') this.input.left = true;
            if (e.code === 'ArrowRight' || e.key === 'd') this.input.right = true;
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.key === 'a') this.input.left = false;
            if (e.code === 'ArrowRight' || e.key === 'd') this.input.right = false;
        });

        this.canvas.addEventListener('mousedown', () => this.handleAction());
    }

    handleAction() {
        if (this.state === STATES.LAUNCH && this.qteActive) {
            this.confirmLaunch();
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.env.groundY = this.canvas.height - 100;
        this.penguin.groundY = this.env.groundY;
    }

    startLaunch() {
        this.state = STATES.LAUNCH;
        this.cameraX = 0;
        this.qtePower = 0;
        this.qteActive = true;
        
        this.penguin.reset();
        this.env.reset();
        
        // Reset music 
        if (this.elements.bgMusic) {
            this.elements.bgMusic.pause();
            this.elements.bgMusic.currentTime = 0;
        }
        
        this.screens.menu.classList.add('hidden');
        this.screens.end.classList.add('hidden');
        this.screens.hud.classList.remove('hidden');
        this.screens.qte.classList.remove('hidden');
    }

    confirmLaunch() {
        this.qteActive = false;
        
        // Precision logic: 0.8 is the perfect spot
        const precision = Math.max(0, 1 - Math.abs(this.qtePower - 0.8) * 4);
        
        this.screens.qte.classList.add('hidden');
        this.state = STATES.TRAVEL;
        
        this.penguin.launch(precision);

        // Play music
        if (this.elements.bgMusic) {
            this.elements.bgMusic.play().catch(e => console.log("Audio play failed:", e));
        }
    }

    endGame() {
        if (this.state === STATES.END) return;
        this.state = STATES.END;
        this.screens.end.classList.remove('hidden');
        
        const finalDist = Math.floor(this.penguin.x / 10);
        this.elements.finalDistVal.textContent = finalDist;
        
        if (finalDist > this.record) {
            this.record = finalDist;
            localStorage.setItem('yeti_launch_record', this.record);
            this.elements.newRecord.classList.remove('hidden');
            this.elements.recordVal.textContent = this.record;
        } else {
            this.elements.newRecord.classList.add('hidden');
        }

        // Stop music or lower volume
        if (this.elements.bgMusic) {
            this.elements.bgMusic.pause();
        }
    }

    updateQTE(dt) {
        if (!this.qteActive) return;
        
        const speed = 2.0; 
        this.qtePower += this.qteDirection * speed * dt;
        
        if (this.qtePower >= 1) {
            this.qtePower = 1;
            this.qteDirection = -1;
        } else if (this.qtePower <= 0) {
            this.qtePower = 0;
            this.qteDirection = 1;
        }
        
        this.elements.qteIndicator.style.left = `${this.qtePower * 100}%`;
    }

    drawParallax(cameraY = 0) {
        // Simple procedural mountains
        this.ctx.fillStyle = '#1e272e';
        for(let i=0; i<5; i++) {
            const px = (i * 800 - (this.cameraX * 0.2)) % 4000;
            const py = this.env.groundY - (cameraY * 0.2); // Subtle vertical parallax
            this.ctx.beginPath();
            this.ctx.moveTo(px, py);
            this.ctx.lineTo(px + 400, py - 300);
            this.ctx.lineTo(px + 800, py);
            this.ctx.fill();
        }
    }

    loop(timestamp) {
        const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000); // Cap dt
        this.lastTime = timestamp;

        this.updateQTE(dt);
        
        if (this.state === STATES.TRAVEL) {
            this.penguin.update(dt, this.input);
            this.env.update(this.penguin.x);
            this.env.checkCollisions(this.penguin);
            
            this.elements.distVal.textContent = Math.floor(this.penguin.x / 10);
            
            
            
            // Camera follow
            const targetCamX = this.penguin.x - window.innerWidth / 2;
            this.cameraX += (targetCamX - this.cameraX) * 0.25; 

            // Vertical Camera Follow
            // Keep the penguin at 50% height (centered)
            const targetCamY = this.penguin.y - window.innerHeight / 2;
            this.cameraY += (targetCamY - this.cameraY) * 0.25; 
        } else {
            // Smoothly return camera Y to 0 when not traveling
            this.cameraY += (0 - this.cameraY) * 0.1;
        }

        // Render
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Background Gradient
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, '#0a0e14');
        grad.addColorStop(1, '#2c3e50');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawParallax(this.cameraY);
        this.env.draw(this.cameraX, this.cameraY);
        this.yeti.draw(this.cameraX, this.cameraY);
        this.penguin.draw(this.cameraX, this.cameraY);
        
        requestAnimationFrame((t) => this.loop(t));
    }
}

window.game = new GameController();
