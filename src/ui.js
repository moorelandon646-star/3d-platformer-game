/**
 * TACTICAL ASSAULT - UI SYSTEM
 * HUD, menus, notifications, and visual feedback
 */

const UI = {
    elements: {},
    
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.loadSettings();
    },
    
    cacheElements() {
        // HUD elements
        this.elements.healthBar = document.getElementById('healthBar');
        this.elements.armorBar = document.getElementById('armorBar');
        this.elements.healthText = document.getElementById('healthText');
        this.elements.armorText = document.getElementById('armorText');
        this.elements.currentAmmo = document.getElementById('currentAmmo');
        this.elements.maxAmmo = document.getElementById('maxAmmo');
        this.elements.reloadBar = document.getElementById('reloadBar');
        this.elements.reloadFill = document.getElementById('reloadFill');
        this.elements.weaponName = document.getElementById('weaponName');
        this.elements.killCount = document.getElementById('killCount');
        this.elements.waveCount = document.getElementById('waveCount');
        this.elements.objectiveText = document.getElementById('objectiveText');
        this.elements.notifications = document.getElementById('notifications');
        this.elements.minimapCanvas = document.getElementById('minimapCanvas');
        this.elements.minimapCtx = this.elements.minimapCanvas.getContext('2d');
        
        // Menu elements
        this.elements.mainMenu = document.getElementById('mainMenu');
        this.elements.pauseMenu = document.getElementById('pauseMenu');
        this.elements.gameOverMenu = document.getElementById('gameOverMenu');
        this.elements.settingsMenu = document.getElementById('settingsMenu');
        this.elements.instructionsMenu = document.getElementById('instructionsMenu');
        this.elements.loadingScreen = document.getElementById('loadingScreen');
        
        // Button elements
        this.elements.playBtn = document.getElementById('playBtn');
        this.elements.settingsBtn = document.getElementById('settingsBtn');
        this.elements.instructionsBtn = document.getElementById('instructionsBtn');
        this.elements.resumeBtn = document.getElementById('resumeBtn');
        this.elements.pauseSettingsBtn = document.getElementById('pauseSettingsBtn');
        this.elements.mainMenuBtn = document.getElementById('mainMenuBtn');
        this.elements.retryBtn = document.getElementById('retryBtn');
        this.elements.quitBtn = document.getElementById('quitBtn');
        this.elements.backBtn = document.getElementById('backBtn');
        this.elements.backInstructionsBtn = document.getElementById('backInstructionsBtn');
        
        // Settings elements
        this.elements.masterVolume = document.getElementById('masterVolume');
        this.elements.volumeValue = document.getElementById('volumeValue');
        this.elements.mouseSensitivity = document.getElementById('mouseSensitivity');
        this.elements.sensitivityValue = document.getElementById('sensitivityValue');
        this.elements.motionBlur = document.getElementById('motionBlur');
        this.elements.screenShake = document.getElementById('screenShake');
        this.elements.muzzleFlash = document.getElementById('muzzleFlash');
        this.elements.shadowQuality = document.getElementById('shadowQuality');
    },
    
    setupEventListeners() {
        this.elements.playBtn.addEventListener('click', () => {
            this.hideMainMenu();
            GameManager.startGame();
        });
        
        this.elements.settingsBtn.addEventListener('click', () => {
            this.hideMainMenu();
            this.showSettingsMenu();
        });
        
        this.elements.instructionsBtn.addEventListener('click', () => {
            this.hideMainMenu();
            this.showInstructionsMenu();
        });
        
        this.elements.resumeBtn.addEventListener('click', () => GameManager.resumeGame());
        this.elements.pauseSettingsBtn.addEventListener('click', () => {
            this.hidePauseMenu();
            this.showSettingsMenu();
        });
        this.elements.mainMenuBtn.addEventListener('click', () => GameManager.returnToMenu());
        this.elements.retryBtn.addEventListener('click', () => {
            this.hideGameOverMenu();
            GameManager.startGame();
        });
        this.elements.quitBtn.addEventListener('click', () => GameManager.returnToMenu());
        
        this.elements.backBtn.addEventListener('click', () => {
            if (GameManager.state === 'playing') {
                this.hideSettingsMenu();
                this.showPauseMenu();
            } else {
                this.hideSettingsMenu();
                this.showMainMenu();
            }
        });
        
        this.elements.backInstructionsBtn.addEventListener('click', () => {
            this.hideInstructionsMenu();
            this.showMainMenu();
        });
        
        // Settings sliders
        this.elements.masterVolume.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.volumeValue.textContent = value + '%';
            AudioManager.setVolume(value / 100);
            Utils.saveSetting('masterVolume', value / 100);
        });
        
        this.elements.mouseSensitivity.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.sensitivityValue.textContent = value;
            if (GameManager.player) {
                GameManager.player.mouseSensitivity = value * 0.001;
            }
            Utils.saveSetting('mouseSensitivity', value);
        });
        
        // Keyboard pause
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && GameManager.state === 'playing') {
                GameManager.pauseGame();
            } else if (e.code === 'Escape' && GameManager.state === 'paused') {
                GameManager.resumeGame();
            }
        });
    },
    
    loadSettings() {
        const volume = Utils.loadSetting('masterVolume', 0.7);
        const sensitivity = Utils.loadSetting('mouseSensitivity', 5);
        
        this.elements.masterVolume.value = volume * 100;
        this.elements.volumeValue.textContent = Math.round(volume * 100) + '%';
        this.elements.mouseSensitivity.value = sensitivity;
        this.elements.sensitivityValue.textContent = sensitivity;
    },
    
    updateHUD(player, wave, kills, score) {
        // Health and armor
        const healthPercent = (player.health / player.maxHealth) * 100;
        const armorPercent = (player.armor / player.maxArmor) * 100;
        
        this.elements.healthBar.style.width = healthPercent + '%';
        this.elements.armorBar.style.width = armorPercent + '%';
        this.elements.healthText.textContent = Math.ceil(player.health) + '/' + player.maxHealth;
        this.elements.armorText.textContent = Math.ceil(player.armor) + '/' + player.maxArmor;
        
        // Ammo
        const weapon = player.weapons[player.currentWeapon];
        this.elements.currentAmmo.textContent = weapon.ammo;
        this.elements.maxAmmo.textContent = weapon.ammoTotal;
        this.elements.weaponName.textContent = weapon.name;
        
        // Reload bar
        if (weapon.isReloading) {
            this.elements.reloadBar.classList.remove('hidden');
            this.elements.reloadFill.style.width = (weapon.reloadProgress * 100) + '%';
        } else {
            this.elements.reloadBar.classList.add('hidden');
        }
        
        // Score
        this.elements.killCount.textContent = kills;
        this.elements.waveCount.textContent = wave;
        
        // Minimap
        this.updateMinimap(player);
        
        // Screen effects
        if (player.screenShake > 0) {
            const shakeAmount = player.screenShake * 2;
            GameManager.camera.position.add(Utils.randomVector(shakeAmount * 0.01));
        }
    },
    
    updateMinimap(player) {
        const canvas = this.elements.minimapCanvas;
        const ctx = this.elements.minimapCtx;
        const scale = 2; // pixels per unit
        
        // Clear
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid
        ctx.strokeStyle = '#00ff00';
        ctx.globalAlpha = 0.2;
        for (let i = 0; i < canvas.width; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += 20) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        
        // Player
        const playerX = canvas.width / 2;
        const playerY = canvas.height / 2;
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(playerX, playerY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Player direction
        ctx.strokeStyle = '#00ff00';
        const dirX = Math.cos(player.yaw);
        const dirY = Math.sin(player.yaw);
        ctx.beginPath();
        ctx.moveTo(playerX, playerY);
        ctx.lineTo(playerX + dirX * 15, playerY + dirY * 15);
        ctx.stroke();
        
        // Enemies
        ctx.fillStyle = '#ff0000';
        for (let enemy of GameManager.enemies) {
            const x = playerX + (enemy.position.x - player.position.x) * scale;
            const y = playerY + (enemy.position.z - player.position.z) * scale;
            
            if (x > 0 && x < canvas.width && y > 0 && y < canvas.height) {
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    },
    
    showNotification(text, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'notification ' + type;
        notification.textContent = text;
        this.elements.notifications.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    },
    
    updateWaveDisplay(wave) {
        this.elements.waveCount.textContent = wave;
    },
    
    // Menu visibility
    showMainMenu() {
        this.elements.mainMenu.classList.remove('hidden');
    },
    
    hideMainMenu() {
        this.elements.mainMenu.classList.add('hidden');
    },
    
    showPauseMenu() {
        this.elements.pauseMenu.classList.remove('hidden');
    },
    
    hidePauseMenu() {
        this.elements.pauseMenu.classList.add('hidden');
    },
    
    showGameOver(kills, waves, score) {
        document.getElementById('finalKills').textContent = kills;
        document.getElementById('finalWaves').textContent = waves;
        document.getElementById('finalScore').textContent = score;
        this.elements.gameOverMenu.classList.remove('hidden');
    },
    
    hideGameOverMenu() {
        this.elements.gameOverMenu.classList.add('hidden');
    },
    
    showSettingsMenu() {
        this.elements.settingsMenu.classList.remove('hidden');
    },
    
    hideSettingsMenu() {
        this.elements.settingsMenu.classList.add('hidden');
    },
    
    showInstructionsMenu() {
        this.elements.instructionsMenu.classList.remove('hidden');
    },
    
    hideInstructionsMenu() {
        this.elements.instructionsMenu.classList.add('hidden');
    },
    
    hideLoadingScreen() {
        this.elements.loadingScreen.classList.add('hidden');
    }
};
