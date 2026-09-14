class Gun {
  constructor(name, damage, fireRate, ammoCapacity, type = 'semi') {
    this.name = name;
    this.damage = damage;
    this.fireRate = fireRate; // milliseconds
    this.ammoCapacity = ammoCapacity;
    this.currentAmmo = ammoCapacity;
    this.ammoInMagazine = ammoCapacity;
    this.type = type; // 'semi', 'burst', 'auto'
    this.lastFiredTime = 0;
    this.range = 1000;
    this.accuracy = 0.95;
    this.recoil = 0;
  }
  
  canFire() {
    return this.ammoInMagazine > 0 && (Date.now() - this.lastFiredTime) >= this.fireRate;
  }
  
  fire() {
    if (!this.canFire()) return false;
    
    this.ammoInMagazine--;
    this.lastFiredTime = Date.now();
    return true;
  }
  
  reload(availableAmmo) {
    const needed = this.ammoCapacity - this.ammoInMagazine;
    const reloaded = Math.min(needed, availableAmmo);
    this.ammoInMagazine += reloaded;
    return reloaded;
  }
  
  getInfo() {
    return {
      name: this.name,
      ammoInMagazine: this.ammoInMagazine,
      ammoCapacity: this.ammoCapacity,
      damage: this.damage,
      fireRate: this.fireRate
    };
  }
}

class GunSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.guns = [];
    this.currentGunIndex = 0;
    this.totalAmmo = 0;
    this.projectiles = [];
    
    this.initializeGuns();
  }
  
  initializeGuns() {
    // Pistol
    this.addGun(new Gun('Pistol', 10, 100, 15, 'semi'));
    
    // Assault Rifle
    this.addGun(new Gun('Assault Rifle', 20, 50, 30, 'auto'));
    
    // Shotgun
    this.addGun(new Gun('Shotgun', 40, 800, 8, 'semi'));
    
    // Sniper Rifle
    this.addGun(new Gun('Sniper Rifle', 80, 1200, 5, 'semi'));
    
    // Set initial ammo
    this.totalAmmo = 300;
    for (let gun of this.guns) {
      gun.currentAmmo = gun.ammoCapacity * 3;
    }
  }
  
  addGun(gun) {
    this.guns.push(gun);
  }
  
  getCurrentGun() {
    return this.guns[this.currentGunIndex];
  }
  
  switchGun(index) {
    if (index >= 0 && index < this.guns.length) {
      this.currentGunIndex = index;
      this.updateGunVisuals();
    }
  }
  
  fire() {
    const gun = this.getCurrentGun();
    if (!gun.fire()) return false;
    
    // Create projectile
    const projectile = this.createProjectile(gun);
    this.projectiles.push(projectile);
    
    return true;
  }
  
  createProjectile(gun) {
    const projectile = {
      position: this.camera.position.clone(),
      direction: new THREE.Vector3(0, 0, -1).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.camera.rotation.y
      ),
      damage: gun.damage,
      speed: 1.5,
      life: 5000, // milliseconds
      createdAt: Date.now(),
      mesh: this.createProjectileMesh()
    };
    
    projectile.position.add(projectile.direction.clone().multiplyScalar(0.5));
    projectile.mesh.position.copy(projectile.position);
    this.scene.add(projectile.mesh);
    
    return projectile;
  }
  
  createProjectileMesh() {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }
  
  updateProjectiles() {
    const now = Date.now();
    
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      
      // Remove if expired
      if (now - projectile.createdAt > projectile.life) {
        this.scene.remove(projectile.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }
      
      // Update position
      projectile.position.addScaledVector(projectile.direction, projectile.speed);
      projectile.mesh.position.copy(projectile.position);
      
      // Check if out of bounds
      if (Math.abs(projectile.position.x) > 200 || 
          Math.abs(projectile.position.y) > 200 ||
          Math.abs(projectile.position.z) > 200) {
        this.scene.remove(projectile.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }
  
  reload() {
    const gun = this.getCurrentGun();
    const reloaded = gun.reload(gun.currentAmmo);
    return reloaded > 0;
  }
  
  updateGunVisuals() {
    // This can be extended to update 3D gun model visuals
  }
  
  getGunStats() {
    const gun = this.getCurrentGun();
    return {
      name: gun.name,
      ammoInMagazine: gun.ammoInMagazine,
      ammoCapacity: gun.ammoCapacity,
      totalAmmo: gun.currentAmmo,
      damage: gun.damage,
      fireRate: gun.fireRate
    };
  }
}