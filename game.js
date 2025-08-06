class PonyGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('ponyHighScore') || '0');
        this.gameRunning = false;
        this.gameStarted = false;
        
        // Game objects
        this.pony = {
            x: 100,
            y: 300,
            width: 60,
            height: 50,
            velocityY: 0,
            onGround: true,
            color: '#FF69B4'
        };
        
        this.obstacles = [];
        this.clouds = [];
        this.particles = [];
        
        // Game settings
        this.gravity = 0.8;
        this.jumpPower = -15;
        this.gameSpeed = 3;
        this.obstacleSpawnRate = 0.015;
        
        // Ground
        this.groundY = 350;
        this.pony.y = this.groundY - this.pony.height;
        
        this.initializeElements();
        this.initializeClouds();
        this.updateScore();
        this.gameLoop();
    }
    
    initializeElements() {
        // Event listeners
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameRunning) {
                e.preventDefault();
                this.jump();
            }
        });
        
        document.getElementById('jumpBtn').addEventListener('click', () => {
            if (this.gameRunning) this.jump();
        });
        
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        // Update high score display
        document.getElementById('highScore').textContent = this.highScore;
    }
    
    initializeClouds() {
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * 150 + 50,
                speed: Math.random() * 0.5 + 0.2,
                size: Math.random() * 30 + 20
            });
        }
    }
    
    startGame() {
        document.getElementById('startScreen').classList.add('hidden');
        this.gameRunning = true;
        this.gameStarted = true;
        this.resetGame();
    }
    
    restartGame() {
        document.getElementById('gameOver').classList.add('hidden');
        this.gameRunning = true;
        this.resetGame();
    }
    
    resetGame() {
        this.score = 0;
        this.obstacles = [];
        this.particles = [];
        this.pony.y = this.groundY - this.pony.height;
        this.pony.velocityY = 0;
        this.pony.onGround = true;
        this.gameSpeed = 3;
        this.updateScore();
    }
    
    jump() {
        if (this.pony.onGround) {
            this.pony.velocityY = this.jumpPower;
            this.pony.onGround = false;
            
            // Add jump particles
            for (let i = 0; i < 5; i++) {
                this.particles.push({
                    x: this.pony.x + this.pony.width / 2,
                    y: this.pony.y + this.pony.height,
                    velocityX: (Math.random() - 0.5) * 4,
                    velocityY: Math.random() * -3,
                    life: 30,
                    color: `hsl(${Math.random() * 60 + 300}, 70%, 60%)`
                });
            }
        }
    }
    
    updatePony() {
        // Apply gravity
        if (!this.pony.onGround) {
            this.pony.velocityY += this.gravity;
        }
        
        // Update position
        this.pony.y += this.pony.velocityY;
        
        // Ground collision
        if (this.pony.y >= this.groundY - this.pony.height) {
            this.pony.y = this.groundY - this.pony.height;
            this.pony.velocityY = 0;
            this.pony.onGround = true;
        }
    }
    
    spawnObstacle() {
        if (Math.random() < this.obstacleSpawnRate) {
            this.obstacles.push({
                x: this.canvas.width,
                y: this.groundY - 40,
                width: 30,
                height: 40,
                color: '#8B4513'
            });
        }
    }
    
    updateObstacles() {
        this.obstacles = this.obstacles.filter(obstacle => {
            obstacle.x -= this.gameSpeed;
            return obstacle.x + obstacle.width > 0;
        });
    }
    
    updateClouds() {
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.size < 0) {
                cloud.x = this.canvas.width + cloud.size;
                cloud.y = Math.random() * 150 + 50;
            }
        });
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.velocityY += 0.2;
            particle.life--;
            return particle.life > 0;
        });
    }
    
    checkCollisions() {
        this.obstacles.forEach(obstacle => {
            if (this.pony.x < obstacle.x + obstacle.width &&
                this.pony.x + this.pony.width > obstacle.x &&
                this.pony.y < obstacle.y + obstacle.height &&
                this.pony.y + this.pony.height > obstacle.y) {
                this.gameOver();
            }
        });
    }
    
    gameOver() {
        this.gameRunning = false;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('ponyHighScore', this.highScore.toString());
            document.getElementById('highScore').textContent = this.highScore;
        }
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').classList.remove('hidden');
    }
    
    updateScore() {
        if (this.gameRunning) {
            this.score++;
            document.getElementById('score').textContent = this.score;
            
            // Increase game speed gradually
            if (this.score % 100 === 0) {
                this.gameSpeed += 0.5;
                this.obstacleSpawnRate += 0.002;
            }
        }
    }
    
    drawPony() {
        const ctx = this.ctx;
        const pony = this.pony;
        
        // Pony body (ellipse)
        ctx.fillStyle = pony.color;
        ctx.beginPath();
        ctx.ellipse(pony.x + pony.width/2, pony.y + pony.height/2, pony.width/3, pony.height/3, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Pony head
        ctx.beginPath();
        ctx.arc(pony.x + pony.width - 15, pony.y + 15, 12, 0, 2 * Math.PI);
        ctx.fill();
        
        // Horn (unicorn!)
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(pony.x + pony.width - 15, pony.y + 3);
        ctx.lineTo(pony.x + pony.width - 12, pony.y - 8);
        ctx.lineTo(pony.x + pony.width - 18, pony.y - 8);
        ctx.closePath();
        ctx.fill();
        
        // Mane
        ctx.fillStyle = '#9370DB';
        ctx.beginPath();
        ctx.ellipse(pony.x + pony.width - 25, pony.y + 10, 8, 15, -0.3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Legs
        ctx.fillStyle = pony.color;
        ctx.fillRect(pony.x + 10, pony.y + pony.height - 15, 8, 15);
        ctx.fillRect(pony.x + pony.width - 25, pony.y + pony.height - 15, 8, 15);
        
        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(pony.x + pony.width - 10, pony.y + 12, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(pony.x + pony.width - 9, pony.y + 12, 1.5, 0, 2 * Math.PI);
        ctx.fill();
        
        // Tail
        ctx.fillStyle = '#9370DB';
        ctx.beginPath();
        ctx.ellipse(pony.x - 5, pony.y + pony.height/2, 6, 20, 0.2, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    drawObstacles() {
        this.obstacles.forEach(obstacle => {
            // Tree trunk
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Tree top
            this.ctx.fillStyle = '#228B22';
            this.ctx.beginPath();
            this.ctx.arc(obstacle.x + obstacle.width/2, obstacle.y - 10, 20, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }
    
    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.clouds.forEach(cloud => {
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.size, 0, 2 * Math.PI);
            this.ctx.arc(cloud.x + cloud.size/2, cloud.y, cloud.size * 0.8, 0, 2 * Math.PI);
            this.ctx.arc(cloud.x - cloud.size/2, cloud.y, cloud.size * 0.8, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / 30;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 3, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });
    }
    
    drawGround() {
        // Grass
        this.ctx.fillStyle = '#32CD32';
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);
        
        // Grass details
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 2;
        for (let x = 0; x < this.canvas.width; x += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.groundY);
            this.ctx.lineTo(x + Math.random() * 4 - 2, this.groundY - Math.random() * 10);
            this.ctx.stroke();
        }
    }
    
    draw() {
        // Clear canvas with sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawClouds();
        this.drawGround();
        this.drawObstacles();
        this.drawPony();
        this.drawParticles();
    }
    
    update() {
        if (!this.gameRunning) return;
        
        this.updatePony();
        this.spawnObstacle();
        this.updateObstacles();
        this.updateClouds();
        this.updateParticles();
        this.checkCollisions();
        
        if (this.gameRunning) {
            this.updateScore();
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new PonyGame();
});

