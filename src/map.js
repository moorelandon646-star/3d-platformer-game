/**
 * TACTICAL ASSAULT - MAP GENERATOR
 * Procedural level design and environment
 */

const MapGenerator = {
    scene: null,
    buildings: [],
    terrain: null,
    lights: [],
    pickups: [],
    
    init(scene) {
        this.scene = scene;
        this.createTerrain();
        this.createBuildings();
        this.createLighting();
        this.createPickups();
    },
    
    createTerrain() {
        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a7c3a,
            roughness: 0.8,
            metalness: 0.1
        });
        this.terrain = new THREE.Mesh(groundGeometry, groundMaterial);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.receiveShadow = true;
        this.scene.add(this.terrain);
        
        // Add grass texture pattern
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        for (let i = 0; i < 2000; i++) {
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            const size = Math.random() * 2;
            ctx.fillStyle = `rgba(100, 150, 100, ${Math.random() * 0.3})`;
            ctx.fillRect(x, y, size, size);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        groundMaterial.map = texture;
    },
    
    createBuildings() {
        const buildingPositions = [
            { x: -30, z: -30, width: 15, depth: 20, height: 15 },
            { x: 30, z: -30, width: 12, depth: 15, height: 12 },
            { x: -30, z: 30, width: 18, depth: 12, height: 18 },
            { x: 30, z: 30, width: 10, depth: 25, height: 14 },
            { x: 0, z: -50, width: 20, depth: 15, height: 20 },
            { x: 0, z: 50, width: 15, depth: 20, height: 15 },
            { x: -50, z: 0, width: 12, depth: 20, height: 12 },
            { x: 50, z: 0, width: 20, depth: 12, height: 16 }
        ];
        
        for (let bData of buildingPositions) {
            const geometry = new THREE.BoxGeometry(bData.width, bData.height, bData.depth);
            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(0, 0, Math.random() * 0.3 + 0.2),
                roughness: 0.7,
                metalness: 0
            });
            
            const building = new THREE.Mesh(geometry, material);
            building.position.set(bData.x, bData.height / 2, bData.z);
            building.castShadow = true;
            building.receiveShadow = true;
            
            this.scene.add(building);
            this.buildings.push(building);
            
            // Add windows
            const windowCount = Math.floor(bData.width / 3);
            for (let i = 0; i < windowCount; i++) {
                for (let j = 0; j < 3; j++) {
                    const windowGeo = new THREE.PlaneGeometry(1, 1);
                    const windowMat = new THREE.MeshStandardMaterial({ color: 0x0033ff });
                    const window = new THREE.Mesh(windowGeo, windowMat);
                    window.position.set(
                        bData.x - bData.width / 2 + i * 3 + 1.5,
                        bData.height - 2 - j * 3,
                        bData.z + bData.depth / 2 + 0.05
                    );
                    this.scene.add(window);
                }
            }
        }
        
        // Add cover objects
        this.addCoverObjects();
    },
    
    addCoverObjects() {
        const coverPositions = [
            { x: 0, z: 0, type: 'sandbags' },
            { x: 15, z: 15, type: 'crate' },
            { x: -15, z: 10, type: 'barrel' },
            { x: 20, z: -20, type: 'sandbags' },
            { x: -20, z: -15, type: 'crate' },
            { x: 10, z: 25, type: 'barrier' }
        ];
        
        for (let cover of coverPositions) {
            let geo, width, height, depth;
            
            if (cover.type === 'sandbags') {
                geo = new THREE.BoxGeometry(3, 0.8, 0.5);
            } else if (cover.type === 'crate') {
                geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
            } else if (cover.type === 'barrel') {
                geo = new THREE.CylinderGeometry(0.4, 0.4, 1, 8);
            } else if (cover.type === 'barrier') {
                geo = new THREE.BoxGeometry(0.2, 1.5, 5);
            }
            
            const mat = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(cover.x, geo.parameters.height / 2, cover.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
        }
    },
    
    createLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
        
        // Directional light (sun)
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(50, 50, 50);
        dirLight.castShadow = true;
        dirLight.shadow.camera.left = -100;
        dirLight.shadow.camera.right = 100;
        dirLight.shadow.camera.top = 100;
        dirLight.shadow.camera.bottom = -100;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.bias = -0.0001;
        this.scene.add(dirLight);
        this.lights.push(dirLight);
        
        // Point lights
        const pointLightPositions = [
            { pos: new THREE.Vector3(-20, 5, -20), color: 0xff6b00, intensity: 1 },
            { pos: new THREE.Vector3(20, 5, 20), color: 0x00d4ff, intensity: 0.8 },
            { pos: new THREE.Vector3(-20, 5, 20), color: 0xffff00, intensity: 0.6 },
            { pos: new THREE.Vector3(20, 5, -20), color: 0xff00ff, intensity: 0.7 }
        ];
        
        for (let light of pointLightPositions) {
            const pointLight = new THREE.PointLight(light.color, light.intensity, 30);
            pointLight.position.copy(light.pos);
            pointLight.castShadow = true;
            this.scene.add(pointLight);
            this.lights.push(pointLight);
        }
    },
    
    createPickups() {
        const pickupTypes = ['ammo', 'health', 'armor'];
        const pickupPositions = [
            new THREE.Vector3(-25, 1.5, -25),
            new THREE.Vector3(25, 1.5, 25),
            new THREE.Vector3(-25, 1.5, 25),
            new THREE.Vector3(25, 1.5, -25),
            new THREE.Vector3(0, 1.5, 0),
            new THREE.Vector3(-15, 1.5, 10),
            new THREE.Vector3(15, 1.5, -10),
            new THREE.Vector3(-10, 1.5, 15)
        ];
        
        for (let i = 0; i < pickupPositions.length; i++) {
            const type = pickupTypes[i % pickupTypes.length];
            this.createPickup(pickupPositions[i], type);
        }
    },
    
    createPickup(position, type) {
        let geometry, color, symbol;
        
        if (type === 'ammo') {
            geometry = new THREE.BoxGeometry(0.3, 0.3, 0.8);
            color = 0xff6b00;
            symbol = '◆';
        } else if (type === 'health') {
            geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
            color = 0x00ff00;
            symbol = '+';
        } else {
            geometry = new THREE.BoxGeometry(0.5, 0.2, 0.5);
            color = 0x00d4ff;
            symbol = '■';
        }
        
        const material = new THREE.MeshStandardMaterial({ color: color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        
        this.pickups.push({
            mesh: mesh,
            position: position.clone(),
            type: type,
            collected: false,
            rotation: 0
        });
    },
    
    updatePickups(deltaTime) {
        for (let pickup of this.pickups) {
            if (!pickup.collected) {
                pickup.rotation += deltaTime * 2;
                pickup.mesh.rotation.y = pickup.rotation;
                pickup.mesh.position.y = pickup.position.y + Math.sin(pickup.rotation) * 0.3;
            }
        }
    }
};
