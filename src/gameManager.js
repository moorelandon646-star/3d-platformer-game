/**
 * TACTICAL ASSAULT - GAME MANAGER
 * Core game loop, state management, and wave system
 */

const GameManager = {
    state: 'menu', // menu, playing, paused, gameover
    scene: null,
    camera: null,
    renderer: null,
    player: null,
    enemies: [],
    gameState: {
        wave: 1,
        kills: 0,
        score: 0,
        time: 0,
        lastShotDistance: Infinity,
        lastShotPos: new THREE.Vector3()
    },
    waveConfig: [
        { enemyCount: 3, difficulty: 0.8 },
        { enemyCount: 5, difficulty: 1.0 },
        { enemyCount: 7, difficulty: 1.2 },
        { enemyCount: 10, difficulty: 1.5 },
        { enemyCount: 12, difficulty: 1.8 },
        { enemyCount: 15, difficulty: 2.0 }
    ],
    deltaTime: 0,
    lastTime: 0,
    
    init(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        AudioManager.init();
        ParticleSystem.init(scene);
        MapGenerator.init(scene);
    },
    
    startGame() {
        this.state = 'playing';
        this.gameState = {
            wave: 1,
            kills: 0,
            score: 0,
            time: 0,
            lastShotDistance: Infinity,
            lastShotPos: new THREE.Vector3()
        };
        this.enemies = [];
        
        // Clear old player
        if (this.player && this.player.camera) {
            this.scene.remove(this.player.camera);
        }
        
        this.player = new Player(
            new THREE.Vector3(0, 1, 0),
            this.scene,
            this.camera
        );
        
        this.spawnWave();
        UI.updateWaveDisplay(this.gameState.wave);
        document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
        this.renderer.domElement.requestPointerLock();
    },
    
    spawnWave() {
        const waveConfig = this.waveConfig[Math.min(this.gameState.wave - 1, this.waveConfig.length - 1)];
        
        for (let i = 0; i < waveConfig.enemyCount; i++) {
            const angle = (Math.PI * 2 * i) / waveConfig.enemyCount;
            const distance = 20 + Math.random() * 10;
            const position = new THREE.Vector3(
                Math.cos(angle) * distance,
                1,
                Math.sin(angle) * distance
            );
            
            const enemy = new Enemy(position, this.scene, this.player);
            
            // Set patrol path
            const patrolPath = [
                position.clone(),
                position.clone().add(new THREE.Vector3(10, 0, 10)),
                position.clone().add(new THREE.Vector3(-10, 0, 10)),
                position.clone().add(new THREE.Vector3(-10, 0, -10))
            ];
            enemy.setPatrolPath(patrolPath);
            
            // Adjust difficulty
            enemy.maxHealth *= waveConfig.difficulty;
            enemy.health = enemy.maxHealth;
            enemy.weapon.damage *= waveConfig.difficulty;
            enemy.speed *= Math.min(1.2, waveConfig.difficulty);
            
            this.enemies.push(enemy);
        }
    },
    
    update() {
        if (this.state !== 'playing') return;
        
        const now = performance.now() / 1000;
        this.deltaTime = Math.min(now - this.lastTime, 0.016); // Cap at 60fps
        this.lastTime = now;
        
        this.gameState.time += this.deltaTime;
        
        // Update player
        this.player.update(this.deltaTime);
        
        // Update enemies
        const aliveEnemies = [];
        for (let enemy of this.enemies) {
            enemy.update(this.deltaTime, this.gameState);
            if (enemy.health > 0) {
                aliveEnemies.push(enemy);
            } else {
                enemy.dispose();
                this.gameState.kills++;
                this.gameState.score += Math.floor(100 + (this.gameState.wave - 1) * 50);
                UI.showNotification(`ENEMY DOWN - +${Math.floor(100 + (this.gameState.wave - 1) * 50)}`, 'kill');
                AudioManager.play('headshot');
                ParticleSystem.spawnExplosion(enemy.position, 1.5);
            }
        }
        this.enemies = aliveEnemies;
        
        // Update map
        MapGenerator.updatePickups(this.deltaTime);
        
        // Check pickups
        this.checkPickups();
        
        // Update particles
        ParticleSystem.update(this.deltaTime);
        
        // Wave progression
        if (this.enemies.length === 0) {
            this.nextWave();
        }
        
        // Game over
        if (this.player.health <= 0) {
            this.gameOver();
        }
        
        UI.updateHUD(this.player, this.gameState.wave, this.gameState.kills, this.gameState.score);
    },
    
    checkPickups() {
        for (let pickup of MapGenerator.pickups) {
            if (pickup.collected) continue;
            
            const dist = Utils.distance(this.player.position, pickup.position);
            if (dist < 2) {
                pickup.collected = true;
                this.scene.remove(pickup.mesh);
                
                if (pickup.type === 'ammo') {
                    this.player.addAmmo(40);
                    UI.showNotification('AMMO PICKUP', 'pickup');
                } else if (pickup.type === 'health') {
                    this.player.addHealth(25);
                    UI.showNotification('HEALTH +25', 'pickup');
                } else if (pickup.type === 'armor') {
                    this.player.addArmor(20);
                    UI.showNotification('ARMOR +20', 'pickup');
                }
                
                AudioManager.play('pickup');
            }
        }
    },
    
    nextWave() {
        this.gameState.wave++;
        
        if (this.gameState.wave > this.waveConfig.length) {
            this.gameState.wave = this.waveConfig.length;
        }
        
        // Respawn player health
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);
        this.player.armor = Math.min(this.player.maxArmor, this.player.armor + 15);
        
        UI.showNotification(`WAVE ${this.gameState.wave} - INCOMING`, 'objective');
        this.spawnWave();
    },
    
    gameOver() {
        this.state = 'gameover';
        UI.showGameOver(this.gameState.kills, this.gameState.wave, this.gameState.score);
    },
    
    onPointerLockChange() {
        if (!document.pointerLockElement) {
            this.pauseGame();
        }
    },
    
    pauseGame() {
        if (this.state === 'playing') {
            this.state = 'paused';
            UI.showPauseMenu();
            document.exitPointerLock();
        }
    },
    
    resumeGame() {
        if (this.state === 'paused') {
            this.state = 'playing';
            UI.hidePauseMenu();
            this.renderer.domElement.requestPointerLock();
        }
    },
    
    returnToMenu() {
        this.state = 'menu';
        this.cleanup();
        UI.showMainMenu();
    },
    
    cleanup() {
        document.exitPointerLock();
        for (let enemy of this.enemies) {
            enemy.dispose();
        }
        this.enemies = [];
    }
};
