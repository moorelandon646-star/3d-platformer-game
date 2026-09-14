class Game {
  constructor() {
    this.setupScene();
    this.setupControls();
    this.setupSystems();
    this.setupEventListeners();
    this.lastFrameTime = Date.now();
    this.frameCount = 0;
    this.fps = 0;
    
    const loadingElement = document.getElementById('loading');
    if (loadingElement) loadingElement.remove();
    
    this.animate();
  }
  
  setupScene() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 500, 1000);
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 1.6, 0);
    
    // Renderer
    const container = document.getElementById('canvas-container');
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    container.appendChild(this.renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    this.scene.add(directionalLight);
    
    this.createEnvironment();
  }
  
  createEnvironment() {
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5016 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    
    // Create platforms (from original platformer)
    this.createPlatforms();
    
    // Create obstacles/enemies
    this.createObstacles();
  }
  
  createPlatforms() {
    const platformPositions = [
      { pos: [0, 2, -20], size: [20, 1, 20], color: 0xff6b6b },
      { pos: [30, 3, -20], size: [15, 1, 15], color: 0xff7700 },
      { pos: [60, 5, -20], size: [15, 1, 15], color: 0xffff00 },
      { pos: [-30, 3, -20], size: [15, 1, 15], color: 0x00ff00 },
      { pos: [30, 8, -50], size: [15, 1, 15], color: 0x00ffff },
      { pos: [0, 10, -80], size: [20, 1, 20], color: 0xff00ff },
    ];
    
    for (let platform of platformPositions) {
      const geometry = new THREE.BoxGeometry(...platform.size);
      const material = new THREE.MeshStandardMaterial({ color: platform.color });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...platform.pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    }
  }
  
  createObstacles() {
    // Create some targets for shooting
    for (let i = 0; i < 5; i++) {
      const x = (Math.random() - 0.5) * 100;
      const z = -50 - Math.random() * 100;
      
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const obstacle = new THREE.Mesh(geometry, material);
      obstacle.position.set(x, 5, z);
      obstacle.castShadow = true;
      obstacle.receiveShadow = true;
      this.scene.add(obstacle);
    }
  }
  
  setupControls() {
    this.fpsController = new FPSController(this.camera, this.renderer.domElement);
  }
  
  setupSystems() {
    this.gunSystem = new GunSystem(this.scene, this.camera);
    this.inventory = new InventorySystem(20);
    this.gameUI = new GameUI();
    
    // Add some starting items to inventory
    this.inventory.addItem({ id: 1, name: 'Pistol', type: 'weapon' }, 1);
    this.inventory.addItem({ id: 2, name: 'Assault Rifle', type: 'weapon' }, 1);
    this.inventory.addItem({ id: 3, name: 'Shotgun', type: 'weapon' }, 1);
    this.inventory.addItem({ id: 4, name: 'Health Pack', type: 'consumable' }, 5);
  }
  
  setupEventListeners() {
    // Mouse click to fire
    document.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left click
        this.gunSystem.fire();
      }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      
      // Weapon switching
      if (key >= '1' && key <= '4') {
        const gunIndex = parseInt(key) - 1;
        this.gunSystem.switchGun(gunIndex);
        this.gameUI.showMessage(`Switched to: ${this.gunSystem.getCurrentGun().name}`);
      }
      
      // Reload
      if (key === 'r') {
        const gun = this.gunSystem.getCurrentGun();
        const reloaded = this.gunSystem.reload();
        if (reloaded) {
          this.gameUI.showMessage('Reloading...');
        } else {
          this.gameUI.showMessage('No ammo!');
        }
      }
      
      // Toggle inventory
      if (key === 'i') {
        this.gameUI.toggleInventory();
        const items = this.inventory.getInventoryList();
        this.gameUI.updateInventory(items);
      }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  updateFPS() {
    this.frameCount++;
    const now = Date.now();
    const delta = now - this.lastFrameTime;
    
    if (delta >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFrameTime = now;
    }
  }
  
  update() {
    // Update FPS controller
    this.fpsController.update();
    
    // Update gun system
    this.gunSystem.updateProjectiles();
    
    // Update UI
    this.gameUI.updateWeaponInfo(this.gunSystem.getGunStats());
    this.gameUI.updateStats(this.fps, this.camera.position);
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    this.update();
    this.updateFPS();
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize game when page loads
window.addEventListener('load', () => {
  new Game();
});