/**
 * TACTICAL ASSAULT - ENEMY SYSTEM
 * Enemy AI, behavior, pathfinding, and combat
 */

class Enemy {
    constructor(position, scene, player) {
        this.position = position.clone();
        this.scene = scene;
        this.player = player;
        
        // Physical properties
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.radius = 0.5;
        this.height = 1.8;
        
        // Stats
        this.maxHealth = 50;
        this.health = this.maxHealth;
        this.armor = 10;
        this.maxArmor = 10;
        this.speed = 3;
        this.sprintSpeed = 5;
        this.isMoving = false;
        
        // AI state
        this.state = 'patrol'; // patrol, search, combat, dead
        this.visionRange = 30;
        this.hearingRange = 40;
        this.detectionLevel = 0; // 0-1
        this.lastSeenPlayerPos = null;
        this.lastSeenPlayerTime = 0;
        this.searchTimeout = 10;
        
        // Combat
        this.weapon = {
            damage: 8,
            firerate: 0.1,
            ammo: 120,
            maxAmmo: 120,
            lastFired: 0,
            range: 50
        };
        this.targetPos = this.position.clone();
        this.combatTimeout = 0;
        this.reloadTimeout = 0;
        this.inCover = false;
        this.takeCoverTimeout = 0;
        
        // Patrol
        this.patrolPath = [];
        this.patrolIndex = 0;
        this.patrolSpeed = 1.5;
        
        // Animation
        this.animationState = 'idle';
        this.animationTime = 0;
        
        // Create 3D model (simple box for now)
        this.createMesh();
    }
    
    createMesh() {
        const geometry = new THREE.CapsuleGeometry(0.3, 1.6, 4, 8);
        const material = new THREE.MeshPhongMaterial({ color: 0x333333 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
        
        // Add health bar
        const hbGeometry = new THREE.PlaneGeometry(1.2, 0.15);
        const hbMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.healthBarBg = new THREE.Mesh(hbGeometry, hbMaterial);
        this.healthBarBg.position.y = 1.1;
        this.mesh.add(this.healthBarBg);
        
        // Health bar fill
        const hbFillGeometry = new THREE.PlaneGeometry(1, 0.1);
        const hbFillMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.healthBar = new THREE.Mesh(hbFillGeometry, hbFillMaterial);
        this.healthBar.position.z = 0.01;
        this.healthBar.position.y = 1.1;
        this.healthBarBg.add(this.healthBar);
    }
    
    setPatrolPath(waypoints) {
        this.patrolPath = waypoints;
        if (waypoints.length > 0) {
            this.targetPos = waypoints[0].clone();
        }
    }
    
    update(deltaTime, gameState) {
        if (this.health <= 0) {
            this.state = 'dead';
            return;
        }
        
        // Update detection
        this.updateDetection();
        
        // Update AI state
        switch (this.state) {
            case 'patrol':
                this.updatePatrol(deltaTime);
                break;
            case 'search':
                this.updateSearch(deltaTime);
                break;
            case 'combat':
                this.updateCombat(deltaTime);
                break;
        }
        
        // Update physics
        this.updatePhysics(deltaTime);
        
        // Update mesh
        this.mesh.position.copy(this.position);
        this.updateHealthBar();
    }
    
    updateDetection() {
        const playerDist = Utils.distance(this.position, this.player.position);
        const playerDir = this.player.position.clone().sub(this.position).normalize();
        const enemyDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.mesh.quaternion);
        const dotProduct = playerDir.dot(enemyDir);
        
        // Vision detection
        if (playerDist < this.visionRange) {
            if (dotProduct > 0.3) { // Within view cone
                this.detectionLevel = Math.min(1, this.detectionLevel + 0.5);
                this.lastSeenPlayerPos = this.player.position.clone();
                this.lastSeenPlayerTime = 0;
            }
        }
        
        // Hearing detection (gunshots)
        if (gameState && gameState.lastShotDistance < this.hearingRange) {
            this.detectionLevel = Math.min(1, this.detectionLevel + 0.3);
            this.lastSeenPlayerPos = gameState.lastShotPos.clone();
            this.lastSeenPlayerTime = 0;
        }
        
        // Change state based on detection
        if (this.detectionLevel > 0.7) {
            this.state = 'combat';
        } else if (this.detectionLevel > 0.3) {
            this.state = 'search';
        } else if (this.state === 'search') {
            this.lastSeenPlayerTime += 1 / 60;
            if (this.lastSeenPlayerTime > this.searchTimeout) {
                this.state = 'patrol';
                this.detectionLevel *= 0.95;
            }
        } else {
            this.detectionLevel *= 0.98;
        }
    }
    
    updatePatrol(deltaTime) {
        if (this.patrolPath.length === 0) return;
        
        const waypoint = this.patrolPath[this.patrolIndex];
        const dist = Utils.distance(this.position, waypoint);
        
        if (dist < 1) {
            this.patrolIndex = (this.patrolIndex + 1) % this.patrolPath.length;
        }
        
        this.moveToward(this.patrolPath[this.patrolIndex], this.patrolSpeed);
    }
    
    updateSearch(deltaTime) {
        if (this.lastSeenPlayerPos) {
            this.moveToward(this.lastSeenPlayerPos, this.speed);
        }
    }
    
    updateCombat(deltaTime) {
        const playerDist = Utils.distance(this.position, this.player.position);
        
        // Take cover if needed
        if (playerDist < 20 && Math.random() < 0.05) {
            this.inCover = !this.inCover;
        }
        
        // Move relative to player
        if (playerDist > 15) {
            this.moveToward(this.player.position, this.sprintSpeed);
        } else if (playerDist < 10 && !this.inCover) {
            this.moveToward(this.player.position.clone().add(Utils.randomVector(3)), this.speed);
        }
        
        // Fire at player
        if (playerDist < this.weapon.range && Math.random() < 0.4) {
            this.fire();
        }
        
        // Reload
        if (this.weapon.ammo < 20 && Math.random() < 0.05) {
            this.reload();
        }
    }
    
    moveToward(target, speed) {
        const direction = target.clone().sub(this.position).normalize();
        this.velocity.copy(direction.multiplyScalar(speed));
        this.isMoving = true;
    }
    
    fire() {
        if (this.weapon.ammo > 0) {
            this.weapon.ammo--;
            
            // Add spread
            const playerPos = this.player.position.clone();
            const spread = Utils.randomVector(0.2);
            playerPos.add(spread);
            
            // Raycast to detect hit
            const dir = playerPos.clone().sub(this.position).normalize();
            const result = {
                hit: false,
                damage: this.weapon.damage
            };
            
            if (Utils.distance(this.position, playerPos) < this.weapon.range) {
                if (Math.random() < 0.6) { // 60% accuracy
                    result.hit = true;
                }
            }
            
            if (result.hit) {
                this.player.takeDamage(result.damage, this.position);
            }
            
            // Particles
            ParticleSystem.spawnMuzzleFlash(this.position.clone().add(new THREE.Vector3(0, 0.5, 0)), dir);
            AudioManager.play('gunfire');
        }
    }
    
    reload() {
        this.weapon.ammo = this.weapon.maxAmmo;
        AudioManager.play('reload');
    }
    
    takeDamage(damage, hitPosition = null) {
        // Armor first
        if (this.armor > 0) {
            const armorAbsorb = Math.min(this.armor, damage * 0.5);
            this.armor -= armorAbsorb;
            damage -= armorAbsorb;
        }
        
        this.health -= damage;
        
        if (hitPosition) {
            const direction = this.position.clone().sub(hitPosition).normalize();
            this.velocity.copy(direction.multiplyScalar(5));
            ParticleSystem.spawnBlood(hitPosition, direction);
        }
        
        // Alert other enemies and enter combat
        this.state = 'combat';
        this.detectionLevel = 1;
    }
    
    updatePhysics(deltaTime) {
        // Gravity
        this.velocity.y -= 9.8 * deltaTime;
        
        // Apply velocity
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Ground collision
        if (this.position.y < 0.5) {
            this.position.y = 0.5;
            this.velocity.y = 0;
        }
        
        // Damping
        if (!this.isMoving) {
            this.velocity.x *= 0.9;
            this.velocity.z *= 0.9;
        }
        this.isMoving = false;
    }
    
    updateHealthBar() {
        const healthPercent = this.health / this.maxHealth;
        this.healthBar.scale.x = Utils.clamp(healthPercent, 0, 1);
        this.healthBar.material.color.set(
            healthPercent < 0.3 ? 0xff0000 : 0x00ff00
        );
    }
    
    dispose() {
        this.scene.remove(this.mesh);
    }
}
