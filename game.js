class PonyGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('ponyHighScore') || '0');
        this.gameRunning = false;
        this.gameStarted = false;
        
        // Load images
        this.images = {};
        this.imagesLoaded = 0;
        this.totalImages = 4;
        this.loadImages();
        
        // Game objects
        this.pony = {
            x: 100,
            y: 300,
            width: 60,
            height: 50,
            velocityY: 0,
            onGround: true,
            color: '#FF69B4',
            canDoubleJump: false,
            hasUsedDoubleJump: false,
            dashCooldown: 0,
            dashMaxCooldown: 45, // Reduced from 60 for faster dash recharge
            isDashing: false,
            dashDuration: 0,
            dashMaxDuration: 20, // Increased from 15 for longer dash
            lives: 3,
            invincible: false,
            invincibilityDuration: 0,
            maxInvincibilityDuration: 180 // Increased from 120 for longer invincibility
        };
        
        this.obstacles = [];
        this.powerUps = [];
        this.clouds = [];
        this.particles = [];
        this.coins = [];
        
        // Game settings
        this.gravity = 0.6; // Reduced from 0.8
        this.jumpPower = -16; // Increased from -15 
        this.gameSpeed = 1.0; // Reduced from 1.5 to make it much easier at start
        this.dashSpeedMultiplier = 1; // New property for dash speed boost
        this.obstacleSpawnRate = 0.002; // Reduced from 0.003 to spawn fewer obstacles
        this.lastObstacleX = -200; // Track last obstacle position
        this.minObstacleDistance = 300; // Increased from 200 for much more spacing
        this.powerUpSpawnRate = 0.008; // Increased from 0.005 for more power-ups
        this.lastPowerUpX = -300;
        this.doubleJumpDuration = 0;
        this.doubleJumpMaxDuration = 300; // 5 seconds at 60fps
        
        // New features
        this.coinSpawnRate = 0.01; // Frequent coin spawns
        this.lastCoinX = -100;
        this.scoreMultiplier = 1;
        this.multiplierDuration = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.maxComboTimer = 180; // 3 seconds to maintain combo
        
        // Ground
        this.groundY = 350;
        this.pony.y = this.groundY - this.pony.height;
        
        this.initializeElements();
        this.initializeClouds();
        this.updateScore();
        this.gameLoop();
    }
    
    loadImages() {
        const imageNames = ['pony', 'tree', 'star', 'cloud'];
        
        imageNames.forEach(name => {
            const img = new Image();
            img.onload = () => {
                this.imagesLoaded++;
                if (this.imagesLoaded === this.totalImages) {
                    this.startGameLoop();
                }
            };
            img.src = `${name}.png`;
            this.images[name] = img;
        });
    }
    
    startGameLoop() {
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
            if (e.code === 'KeyD' && this.gameRunning) {
                e.preventDefault();
                this.dash();
            }
        });
        
        document.getElementById('jumpBtn').addEventListener('click', () => {
            if (this.gameRunning) this.jump();
        });
        
        document.getElementById('dashBtn').addEventListener('click', () => {
            if (this.gameRunning) this.dash();
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
        this.powerUps = [];
        this.coins = [];
        this.particles = [];
        this.pony.y = this.groundY - this.pony.height;
        this.pony.velocityY = 0;
        this.pony.onGround = true;
        this.pony.canDoubleJump = false;
        this.pony.hasUsedDoubleJump = false;
        this.pony.dashCooldown = 0;
        this.pony.isDashing = false;
        this.pony.dashDuration = 0;
        this.pony.lives = 3;
        this.pony.invincible = false;
        this.pony.invincibilityDuration = 0;
        this.dashSpeedMultiplier = 1; // Reset dash speed multiplier
        this.gameSpeed = 1.0; // Reset to easier starting speed
        this.obstacleSpawnRate = 0.002; // Reset to easier spawn rate
        this.lastObstacleX = -200;
        this.minObstacleDistance = 300; // Reset to more spacing
        this.powerUpSpawnRate = 0.008; // More frequent power-ups
        this.lastPowerUpX = -300;
        this.doubleJumpDuration = 0;
        // Reset new features
        this.lastCoinX = -100;
        this.scoreMultiplier = 1;
        this.multiplierDuration = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.updateScore();
        this.updateLives();
    }
    
    jump() {
        if (this.pony.onGround) {
            this.pony.velocityY = this.jumpPower;
            this.pony.onGround = false;
            this.pony.hasUsedDoubleJump = false; // Reset double jump when landing
            
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
        } else if (this.pony.canDoubleJump && !this.pony.hasUsedDoubleJump) {
            // Double jump
            this.pony.velocityY = this.jumpPower * 0.8; // Slightly weaker second jump
            this.pony.hasUsedDoubleJump = true;
            
            // Add special double jump particles
            for (let i = 0; i < 8; i++) {
                this.particles.push({
                    x: this.pony.x + this.pony.width / 2,
                    y: this.pony.y + this.pony.height / 2,
                    velocityX: (Math.random() - 0.5) * 6,
                    velocityY: Math.random() * -4,
                    life: 40,
                    color: '#FFD700'
                });
            }
        }
    }
    
    dash() {
        if (this.pony.dashCooldown <= 0) {
            // Instead of moving pony, increase world speed
            this.pony.isDashing = true;
            this.pony.dashDuration = this.pony.dashMaxDuration;
            this.pony.dashCooldown = this.pony.dashMaxCooldown;
            this.dashSpeedMultiplier = 2.5; // Make world move faster during dash
            
            // Add dash particles
            for (let i = 0; i < 8; i++) {
                this.particles.push({
                    x: this.pony.x,
                    y: this.pony.y + this.pony.height / 2 + (Math.random() - 0.5) * this.pony.height,
                    velocityX: Math.random() * -6 - 2,
                    velocityY: (Math.random() - 0.5) * 4,
                    life: 20,
                    color: '#00FFFF'
                });
            }
        }
    }
    
    updatePony() {
        // Apply gravity
        if (!this.pony.onGround) {
            this.pony.velocityY += this.gravity;
        }
        
        // Update dash
        if (this.pony.isDashing) {
            this.pony.dashDuration--;
            if (this.pony.dashDuration <= 0) {
                this.pony.isDashing = false;
                this.dashSpeedMultiplier = 1; // Reset speed multiplier when dash ends
            }
        }
        
        // Update dash cooldown
        if (this.pony.dashCooldown > 0) {
            this.pony.dashCooldown--;
        }
        
        // Update invincibility
        if (this.pony.invincible) {
            this.pony.invincibilityDuration--;
            if (this.pony.invincibilityDuration <= 0) {
                this.pony.invincible = false;
            }
        }
        
        // Update vertical position only
        this.pony.y += this.pony.velocityY;
        
        // Ground collision
        if (this.pony.y >= this.groundY - this.pony.height) {
            this.pony.y = this.groundY - this.pony.height;
            this.pony.velocityY = 0;
            this.pony.onGround = true;
        }
        
        // Update double jump power-up
        if (this.doubleJumpDuration > 0) {
            this.doubleJumpDuration--;
            this.pony.canDoubleJump = true;
        } else {
            this.pony.canDoubleJump = false;
        }
    }
    
    spawnObstacle() {
        const currentX = this.canvas.width;
        
        // Only spawn if enough distance has passed since last obstacle
        if (currentX - this.lastObstacleX >= this.minObstacleDistance) {
            if (Math.random() < this.obstacleSpawnRate) {
                this.obstacles.push({
                    x: currentX,
                    y: this.groundY - 25, // Smaller height
                    width: 15, // Even smaller width
                    height: 25, // Even smaller height
                    color: '#8B4513'
                });
                this.lastObstacleX = currentX;
            }
        }
    }

    spawnCoin() {
        const currentX = this.canvas.width;
        
        if (currentX - this.lastCoinX >= 80) {
            if (Math.random() < this.coinSpawnRate) {
                // Check if there's an obstacle nearby
                const hasNearbyObstacle = this.obstacles.some(obs => 
                    Math.abs(obs.x - currentX) < 100
                );
                
                if (!hasNearbyObstacle) {
                    this.coins.push({
                        x: currentX,
                        y: this.groundY - 40 - Math.random() * 60, // Random height
                        width: 20,
                        height: 20,
                        glow: 0,
                        collected: false
                    });
                    this.lastCoinX = currentX;
                }
            }
        }
    }
    
    spawnPowerUp() {
        const currentX = this.canvas.width;
        
        // Spawn power-ups less frequently and away from obstacles
        if (currentX - this.lastPowerUpX >= 120) { // Reduced for more frequent spawns
            if (Math.random() < this.powerUpSpawnRate) {
                // Check if there's an obstacle nearby
                const hasNearbyObstacle = this.obstacles.some(obs => 
                    Math.abs(obs.x - currentX) < 80
                );
                
                if (!hasNearbyObstacle) {
                    // Add variety to power-ups including new ones
                    const powerUpTypes = ['doubleJump', 'speed', 'shield', 'life', 'multiplier', 'slowMotion'];
                    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
                    
                    let powerUp = {
                        x: currentX,
                        y: this.groundY - 80, // Higher up than obstacles
                        width: 25,
                        height: 25,
                        type: randomType,
                        color: '#FFD700',
                        glow: 0
                    };
                    
                    // Different colors and effects for different power-ups
                    switch (randomType) {
                        case 'speed':
                            powerUp.color = '#FF4500';
                            powerUp.y = this.groundY - 60;
                            break;
                        case 'shield':
                            powerUp.color = '#4169E1';
                            powerUp.y = this.groundY - 70;
                            break;
                        case 'life':
                            powerUp.color = '#FF1493';
                            powerUp.y = this.groundY - 75;
                            break;
                        case 'multiplier':
                            powerUp.color = '#9932CC';
                            powerUp.y = this.groundY - 65;
                            break;
                        case 'slowMotion':
                            powerUp.color = '#00CED1';
                            powerUp.y = this.groundY - 85;
                            break;
                    }
                    
                    this.powerUps.push(powerUp);
                    this.lastPowerUpX = currentX;
                }
            }
        }
    }
    
    updateObstacles() {
        this.obstacles = this.obstacles.filter(obstacle => {
            obstacle.x -= this.gameSpeed * this.dashSpeedMultiplier; // Apply dash speed multiplier
            return obstacle.x + obstacle.width > 0;
        });
        
        // Update lastObstacleX position
        if (this.obstacles.length > 0) {
            const rightmostObstacle = this.obstacles[this.obstacles.length - 1];
            if (rightmostObstacle.x < this.canvas.width) {
                this.lastObstacleX = rightmostObstacle.x;
            }
        }
    }
    
    updatePowerUps() {
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.x -= this.gameSpeed * this.dashSpeedMultiplier; // Apply dash speed multiplier
            powerUp.glow += 0.2; // For glowing effect
            return powerUp.x + powerUp.width > 0;
        });
        
        // Update lastPowerUpX position
        if (this.powerUps.length > 0) {
            const rightmostPowerUp = this.powerUps[this.powerUps.length - 1];
            if (rightmostPowerUp.x < this.canvas.width) {
                this.lastPowerUpX = rightmostPowerUp.x;
            }
        }
    }
    
    updateClouds() {
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed * this.dashSpeedMultiplier; // Apply dash speed multiplier
            if (cloud.x + cloud.size < 0) {
                cloud.x = this.canvas.width + cloud.size;
                cloud.y = Math.random() * 150 + 50;
            }
        });
    }

    updateCoins() {
        this.coins = this.coins.filter(coin => {
            coin.x -= this.gameSpeed * this.dashSpeedMultiplier;
            coin.glow += 0.3; // For glowing effect
            return coin.x + coin.width > 0;
        });
        
        // Update lastCoinX position
        if (this.coins.length > 0) {
            const rightmostCoin = this.coins[this.coins.length - 1];
            if (rightmostCoin.x < this.canvas.width) {
                this.lastCoinX = rightmostCoin.x;
            }
        }
    }

    updateGameFeatures() {
        // Update score multiplier
        if (this.multiplierDuration > 0) {
            this.multiplierDuration--;
        } else {
            this.scoreMultiplier = 1;
        }
        
        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer--;
        } else if (this.combo > 0) {
            this.combo = 0; // Reset combo if timer runs out
        }
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
        // Check obstacle collisions only if not invincible
        if (!this.pony.invincible) {
            this.obstacles.forEach(obstacle => {
                if (this.pony.x < obstacle.x + obstacle.width &&
                    this.pony.x + this.pony.width > obstacle.x &&
                    this.pony.y < obstacle.y + obstacle.height &&
                    this.pony.y + this.pony.height > obstacle.y) {
                    this.takeDamage();
                }
            });
        }

        // Check coin collisions
        this.coins = this.coins.filter(coin => {
            if (!coin.collected && 
                this.pony.x < coin.x + coin.width &&
                this.pony.x + this.pony.width > coin.x &&
                this.pony.y < coin.y + coin.height &&
                this.pony.y + this.pony.height > coin.y) {
                
                // Collect coin
                coin.collected = true;
                this.score += 10 * this.scoreMultiplier;
                this.combo++;
                this.comboTimer = this.maxComboTimer;
                
                // Add collection particles
                for (let i = 0; i < 8; i++) {
                    this.particles.push({
                        x: coin.x + coin.width / 2,
                        y: coin.y + coin.height / 2,
                        velocityX: (Math.random() - 0.5) * 6,
                        velocityY: (Math.random() - 0.5) * 6,
                        life: 40,
                        color: '#FFD700'
                    });
                }
                return false; // Remove collected coin
            }
            return !coin.collected; // Keep uncollected coins
        });

        // Check power-up collisions
        if (this.powerUps && this.powerUps.length > 0) {
            this.powerUps = this.powerUps.filter(powerUp => {
                if (powerUp && this.pony.x < powerUp.x + powerUp.width &&
                    this.pony.x + this.pony.width > powerUp.x &&
                    this.pony.y < powerUp.y + powerUp.height &&
                    this.pony.y + this.pony.height > powerUp.y) {
                    
                    // Collect power-up
                    if (powerUp.type === 'doubleJump') {
                        this.doubleJumpDuration = this.doubleJumpMaxDuration;
                    } else if (powerUp.type === 'speed') {
                        // Temporary speed boost
                        this.gameSpeed += 0.5; // Reduced boost for easier gameplay
                        setTimeout(() => {
                            this.gameSpeed = Math.max(1.0, this.gameSpeed - 0.5);
                        }, 3000);
                    } else if (powerUp.type === 'shield') {
                        // Temporary invincibility
                        this.pony.invincible = true;
                        this.pony.invincibilityDuration = 240; // 4 seconds
                    } else if (powerUp.type === 'life') {
                        // Restore a life
                        this.pony.lives = Math.min(this.pony.lives + 1, 5); // Cap at 5 lives
                        this.updateLives();
                    } else if (powerUp.type === 'multiplier') {
                        // Score multiplier
                        this.scoreMultiplier = 2;
                        this.multiplierDuration = 600; // 10 seconds
                    } else if (powerUp.type === 'slowMotion') {
                        // Slow down everything temporarily
                        const originalSpeed = this.gameSpeed;
                        this.gameSpeed *= 0.5;
                        setTimeout(() => {
                            this.gameSpeed = originalSpeed;
                        }, 5000);
                    }
                        
                    // Add collection particles
                    for (let i = 0; i < 10; i++) {
                        this.particles.push({
                            x: powerUp.x + powerUp.width / 2,
                            y: powerUp.y + powerUp.height / 2,
                            velocityX: (Math.random() - 0.5) * 8,
                            velocityY: (Math.random() - 0.5) * 8,
                            life: 50,
                            color: powerUp.color
                        });
                    }
                    return false; // Remove collected power-up
                }
                return true; // Keep uncollected power-up
            });
        }
    }
    
    takeDamage() {
        this.pony.lives--;
        this.pony.invincible = true;
        this.pony.invincibilityDuration = this.pony.maxInvincibilityDuration;
        this.updateLives();
        
        if (this.pony.lives <= 0) {
            this.gameOver();
        }
        
        // Add damage particles
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.pony.x + this.pony.width / 2,
                y: this.pony.y + this.pony.height / 2,
                velocityX: (Math.random() - 0.5) * 8,
                velocityY: (Math.random() - 0.5) * 8,
                life: 40,
                color: '#FF0000'
            });
        }
    }
    
    updateLives() {
        document.getElementById('lives').textContent = this.pony.lives;
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
            this.score += this.scoreMultiplier;
            document.getElementById('score').textContent = this.score;
            
            // Update dash button state
            const dashBtn = document.getElementById('dashBtn');
            if (this.pony.dashCooldown > 0) {
                dashBtn.disabled = true;
                dashBtn.textContent = `⏳ ${Math.ceil(this.pony.dashCooldown / 60)}s`;
            } else {
                dashBtn.disabled = false;
                dashBtn.textContent = '⚡ DASH';
            }
            
            // Increase game speed and difficulty much more gradually
            if (this.score % 400 === 0) { // Changed from 200 to 400 for much slower progression
                this.gameSpeed += 0.1; // Reduced from 0.2 for gentler increase
                this.obstacleSpawnRate += 0.0005; // Reduced from 0.0008 for slower spawn increase
                this.minObstacleDistance = Math.max(200, this.minObstacleDistance - 2); // Slower reduction
            }
        }
    }
    
    drawPony() {
        const ctx = this.ctx;
        const pony = this.pony;
        
        // Add invincibility flashing effect
        if (pony.invincible && Math.floor(pony.invincibilityDuration / 10) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Add dash effect
        if (pony.isDashing) {
            ctx.shadowColor = '#00FFFF';
            ctx.shadowBlur = 15;
        }
        
        // Draw pony image
        if (this.images.pony) {
            ctx.drawImage(this.images.pony, pony.x, pony.y, pony.width, pony.height);
        }
        
        // Reset effects
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
    
    drawObstacles() {
        this.obstacles.forEach(obstacle => {
            if (this.images.tree) {
                this.ctx.drawImage(this.images.tree, obstacle.x, obstacle.y - 15, obstacle.width, obstacle.height + 15);
            }
        });
    }
    
    drawClouds() {
        this.clouds.forEach(cloud => {
            if (this.images.cloud) {
                this.ctx.drawImage(this.images.cloud, cloud.x - cloud.size, cloud.y - cloud.size/2, cloud.size * 2, cloud.size);
            }
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
    
    drawCoins() {
        this.coins.forEach(coin => {
            if (!coin.collected) {
                const ctx = this.ctx;
                
                // Glowing effect
                const glowIntensity = Math.sin(coin.glow) * 0.5 + 0.5;
                const floatOffset = Math.sin(coin.glow * 0.7) * 2;
                
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 10 * glowIntensity;
                
                // Draw coin as golden circle
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2 + floatOffset, coin.width/2, 0, 2 * Math.PI);
                ctx.fill();
                
                // Inner shine
                ctx.fillStyle = '#FFF700';
                ctx.beginPath();
                ctx.arc(coin.x + coin.width/2 - 3, coin.y + coin.height/2 + floatOffset - 3, coin.width/4, 0, 2 * Math.PI);
                ctx.fill();
                
                // Reset shadow
                ctx.shadowBlur = 0;
            }
        });
    }
    
    drawPowerUps() {
        this.powerUps.forEach(powerUp => {
            const ctx = this.ctx;
            
            // Different visual effects for different power-ups
            const glowIntensity = Math.sin(powerUp.glow) * 0.5 + 0.5;
            
            // Add floating effect
            const floatOffset = Math.sin(powerUp.glow * 0.5) * 3;
            
            ctx.shadowColor = powerUp.color;
            ctx.shadowBlur = 15 * glowIntensity;
            
            // Draw different shapes or use star image for all
            if (this.images.star) {
                ctx.drawImage(this.images.star, powerUp.x, powerUp.y + floatOffset, powerUp.width, powerUp.height);
                
                // Add type indicator
                ctx.fillStyle = powerUp.color;
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                let text = '';
                switch (powerUp.type) {
                    case 'doubleJump': text = '2X'; break;
                    case 'speed': text = 'S'; break;
                    case 'shield': text = '🛡'; break;
                    case 'life': text = '💖'; break;
                    case 'multiplier': text = 'X2'; break;
                    case 'slowMotion': text = '⏰'; break;
                }
                ctx.fillText(text, powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2 + floatOffset + 4);
                ctx.textAlign = 'left';
            }
            
            // Reset shadow
            ctx.shadowBlur = 0;
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
        this.drawCoins();
        this.drawObstacles();
        this.drawPowerUps();
        this.drawPony();
        this.drawParticles();
        
        // Draw score multiplier indicator
        if (this.scoreMultiplier > 1) {
            this.ctx.fillStyle = 'rgba(153, 50, 204, 0.9)';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`${this.scoreMultiplier}X MULTIPLIER!`, 10, 50);
            
            // Progress bar for multiplier
            const barWidth = 100;
            const barHeight = 8;
            const progress = this.multiplierDuration / 600;
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(10, 55, barWidth, barHeight);
            
            this.ctx.fillStyle = '#9932CC';
            this.ctx.fillRect(10, 55, barWidth * progress, barHeight);
        }
        
        // Draw combo indicator
        if (this.combo > 1) {
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
            this.ctx.font = '14px Arial';
            this.ctx.fillText(`COMBO x${this.combo}`, this.canvas.width - 120, 30);
            
            // Combo timer bar
            const barWidth = 80;
            const barHeight = 6;
            const progress = this.comboTimer / this.maxComboTimer;
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(this.canvas.width - 120, 35, barWidth, barHeight);
            
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(this.canvas.width - 120, 35, barWidth * progress, barWidth);
        }

        // Draw double jump indicator
        if (this.pony.canDoubleJump) {
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('DOUBLE JUMP!', 10, 30);
            
            // Progress bar
            const barWidth = 100;
            const barHeight = 8;
            const progress = this.doubleJumpDuration / this.doubleJumpMaxDuration;
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(10, 35, barWidth, barHeight);
            
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(10, 35, barWidth * progress, barHeight);
        }
        
        // Draw shield indicator
        if (this.pony.invincible && this.pony.invincibilityDuration > 120) {
            this.ctx.fillStyle = 'rgba(65, 105, 225, 0.8)';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('SHIELD ACTIVE!', 10, 75);
            
            // Progress bar for shield
            const barWidth = 100;
            const barHeight = 8;
            const maxShield = 240;
            const progress = this.pony.invincibilityDuration / maxShield;
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(10, 80, barWidth, barHeight);
            
            this.ctx.fillStyle = '#4169E1';
            this.ctx.fillRect(10, 80, barWidth * progress, barHeight);
        }
        
        // Draw dash cooldown indicator
        if (this.pony.dashCooldown > 0) {
            const barWidth = 80;
            const barHeight = 6;
            const progress = 1 - (this.pony.dashCooldown / this.pony.dashMaxCooldown);
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(10, 95, barWidth, barHeight);
            
            this.ctx.fillStyle = '#00FFFF';
            this.ctx.fillRect(10, 95, barWidth * progress, barHeight);
            
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
            this.ctx.font = '12px Arial';
            this.ctx.fillText('DASH COOLDOWN', 10, 92);
        }
    }
    
    update() {
        if (!this.gameRunning) return;
        
        this.updatePony();
        this.spawnObstacle();
        this.spawnPowerUp();
        this.spawnCoin();
        this.updateObstacles();
        this.updatePowerUps();
        this.updateCoins();
        this.updateClouds();
        this.updateParticles();
        this.updateGameFeatures();
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