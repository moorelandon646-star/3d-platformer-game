/**
 * TACTICAL ASSAULT - PLAYER CONTROLLER
 * Player movement, combat, and interaction
 */

class Player {
    constructor(startPosition, scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.position = startPosition.clone();
        this.velocity = new THREE.Vector3();
        
        // Player stats
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.maxArmor = 50;
        this.armor = this.maxArmor;
        
        // Movement
        this.speed = 5;
        this.sprintSpeed = 8;
        this.jumpForce = 6;
        this.crouchSpeed = 2.5;
        this.isGrounded = false;
        this.canJump = true;
        
        // State
        this.isSprinting = false;
        this.isCrouching = false;
        this.isAiming = false;
        this.moveDirection = new THREE.Vector3();
        
        // Input
        this.keys = {};
        this.mouse = { x: 0, y: 0, delta: { x: 0, y: 0 } };
        this.mouseSensitivity = Utils.loadSetting('mouseSensitivity', 5) * 0.001;
        
        // Camera
        this.pitch = 0;
        this.yaw = 0;
        this.cameraBob = 0;
        this.cameraBobAmount = 0.1;
        
        // Weapon system
        this.currentWeapon = 0;
        this.weapons = [
            { // AR-15
                name: 'AR-15 ASSAULT RIFLE',
                damage: 15,
                firerate: 0.08,
                ammo: 30,
                maxAmmo: 30,
                maxAmmoTotal: 240,
                ammoTotal: 240,
                range: 100,
                spread: 0.05,
                reloadTime: 2.5,
                lastFired: 0,
                isReloading: false,
                reloadProgress: 0
            },
            { // SMG
                name: 'MP5 SUBMACHINE GUN',
                damage: 10,
                firerate: 0.05,
                ammo: 25,
                maxAmmo: 25,
                maxAmmoTotal: 300,
                ammoTotal: 300,
                range: 30,
                spread: 0.1,
                reloadTime: 1.8,
                lastFired: 0,
                isReloading: false,
                reloadProgress: 0
            },
            { // Pistol
                name: 'M9 PISTOL',
                damage: 20,
                firerate: 0.15,
                ammo: 15,
                maxAmmo: 15,
                maxAmmoTotal: 120,
                ammoTotal: 120,
                range: 50,
                spread: 0.15,
                reloadTime: 1.5,
                lastFired: 0,
                isReloading: false,
                reloadProgress: 0
            }
        ];
        
        // Screen effects
        this.screenShake = 0;
        this.motionBlur = 0;
        this.damageVignette = 0;
        
        this.setupInput();
        this.camera.position.copy(this.position.clone().add(new THREE.Vector3(0, 0.6, 0)));
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        window.addEventListener('mousemove', (e) => {
            this.mouse.delta.x = e.movementX || 0;
            this.mouse.delta.y = e.movementY || 0;
        });
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.fire();
            if (e.button === 2) this.isAiming = true;
        });
        window.addEventListener('mouseup', (e) => {
            if (e.button === 2) this.isAiming = false;
        });
    }
    
    update(deltaTime) {
        this.handleInput(deltaTime);
        this.updateMovement(deltaTime);
        this.updateCamera();
        this.updateWeapon(deltaTime);
        this.updateScreenEffects(deltaTime);
    }
    
    handleInput(deltaTime) {
        // Movement
        this.moveDirection.set(0, 0, 0);
        if (this.keys['KeyW'] || this.keys['ArrowUp']) this.moveDirection.z -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) this.moveDirection.z += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) this.moveDirection.x -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) this.moveDirection.x += 1;
        
        // Normalize diagonal movement
        if (this.moveDirection.length() > 0) {
            this.moveDirection.normalize();
        }
        
        // Sprint
        this.isSprinting = this.keys['ShiftLeft'] && this.moveDirection.length() > 0;
        
        // Crouch
        if (this.keys['ControlLeft'] && !this.isSprinting) {
            this.isCrouching = true;
        }
        if (this.keys['ControlLeft'] === false) {
            this.isCrouching = false;
        }
        
        // Jump
        if (this.keys[' '] && this.isGrounded && !this.isCrouching) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
            AudioManager.play('jump');
            this.keys[' '] = false;
        }
        
        // Reload
        if (this.keys['KeyR']) {
            this.reload();
            this.keys['KeyR'] = false;
        }
        
        // Switch weapons
        if (this.keys['Digit1']) {
            this.switchWeapon(0);
            this.keys['Digit1'] = false;
        }
        if (this.keys['Digit2']) {
            this.switchWeapon(1);
            this.keys['Digit2'] = false;
        }
        if (this.keys['Digit3']) {
            this.switchWeapon(2);
            this.keys['Digit3'] = false;
        }
    }
    
    updateMovement(deltaTime) {
        const currentSpeed = this.isSprinting ? this.sprintSpeed : 
                           this.isCrouching ? this.crouchSpeed : this.speed;
        
        // Apply movement based on camera direction
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        
        const moveVec = new THREE.Vector3();
        moveVec.addScaledVector(forward, this.moveDirection.z * currentSpeed);
        moveVec.addScaledVector(right, this.moveDirection.x * currentSpeed);
        
        this.velocity.x = moveVec.x;
        this.velocity.z = moveVec.z;
        
        // Gravity
        this.velocity.y -= 9.8 * deltaTime;
        
        // Apply velocity
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Ground collision
        if (this.position.y < 0.5) {
            this.position.y = 0.5;
            this.velocity.y = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }
        
        // Footsteps
        if (this.moveDirection.length() > 0 && this.isGrounded) {
            if (Math.random() < 0.1) {
                AudioManager.play('footstep');
            }
        }
    }
    
    updateCamera() {
        // Rotate camera with mouse
        this.yaw -= this.mouse.delta.x * this.mouseSensitivity;
        this.pitch += this.mouse.delta.y * this.mouseSensitivity;
        this.pitch = Utils.clamp(this.pitch, -Math.PI / 2, Math.PI / 2);
        
        // Camera bob
        if (this.moveDirection.length() > 0 && this.isGrounded) {
            this.cameraBob += deltaTime * (this.isSprinting ? 10 : 5);
        } else {
            this.cameraBob *= 0.9;
        }
        
        const bobAmount = Math.sin(this.cameraBob) * this.cameraBobAmount * (this.isSprinting ? 1.5 : 1);
        
        // Apply camera position and rotation
        const eyeHeight = this.isCrouching ? 0.3 : 0.6;
        const cameraPos = this.position.clone().add(new THREE.Vector3(0, eyeHeight + bobAmount * 0.1, 0));
        this.camera.position.lerp(cameraPos, 0.1);
        
        // Apply camera rotation
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
        
        this.mouse.delta.x = 0;
        this.mouse.delta.y = 0;
    }
    
    fire() {
        const weapon = this.weapons[this.currentWeapon];
        const now = Date.now() / 1000;
        
        if (weapon.isReloading || weapon.ammo <= 0) {
            if (weapon.ammo <= 0) {
                AudioManager.play('empty');
            }
            return;
        }
        
        if (now - weapon.lastFired < weapon.firerate) return;
        
        weapon.ammo--;
        weapon.lastFired = now;
        
        // Muzzle flash
        const muzzlePos = this.camera.position.clone().add(
            new THREE.Vector3(0.3, -0.1, -0.5).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw)
        );
        const muzzleDir = new THREE.Vector3(0, 0, -1)
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw)
            .applyAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch);
        
        ParticleSystem.spawnMuzzleFlash(muzzlePos, muzzleDir);
        
        // Spread
        const spread = weapon.spread * (this.isAiming ? 0.5 : 1);
        muzzleDir.applyAxisAngle(Utils.randomVector(1), Math.random() * spread);
        
        // Recoil
        this.pitch -= (Math.random() - 0.5) * 0.02;
        this.yaw -= (Math.random() - 0.5) * 0.01;
        this.screenShake = 0.3;
        
        // Audio
        AudioManager.play('gunfire');
    }
    
    reload() {
        const weapon = this.weapons[this.currentWeapon];
        if (weapon.isReloading || weapon.ammo === weapon.maxAmmo || weapon.ammoTotal <= 0) return;
        
        weapon.isReloading = true;
        weapon.reloadProgress = 0;
        AudioManager.play('reload');
    }
    
    switchWeapon(index) {
        if (index !== this.currentWeapon && index < this.weapons.length) {
            this.currentWeapon = index;
            AudioManager.play('ui_click');
        }
    }
    
    updateWeapon(deltaTime) {
        const weapon = this.weapons[this.currentWeapon];
        
        if (weapon.isReloading) {
            weapon.reloadProgress += deltaTime / weapon.reloadTime;
            
            if (weapon.reloadProgress >= 1) {
                const ammoNeeded = weapon.maxAmmo - weapon.ammo;
                const ammoTransfer = Math.min(ammoNeeded, weapon.ammoTotal);
                weapon.ammo += ammoTransfer;
                weapon.ammoTotal -= ammoTransfer;
                weapon.isReloading = false;
                weapon.reloadProgress = 0;
            }
        }
    }
    
    takeDamage(damage, hitPos = null) {
        const actualDamage = damage;
        
        // Armor absorption
        const armorAbsorb = Math.min(this.armor, actualDamage * 0.6);
        this.armor -= armorAbsorb;
        const healthDamage = actualDamage - armorAbsorb;
        
        this.health -= healthDamage;
        
        // Screen effects
        this.damageVignette = 0.4;
        this.screenShake = 0.5;
        
        // Sound
        AudioManager.play('damage');
        
        if (this.health <= 0) {
            this.health = 0;
            return true; // Dead
        }
        return false;
    }
    
    updateScreenEffects(deltaTime) {
        this.screenShake *= 0.95;
        this.damageVignette *= 0.95;
        this.motionBlur *= 0.95;
    }
    
    addAmmo(amount) {
        const weapon = this.weapons[this.currentWeapon];
        weapon.ammoTotal = Math.min(weapon.ammoTotal + amount, weapon.maxAmmoTotal);
    }
    
    addHealth(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }
    
    addArmor(amount) {
        this.armor = Math.min(this.armor + amount, this.maxArmor);
    }
}
