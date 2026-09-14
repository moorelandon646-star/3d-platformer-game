/**
 * TACTICAL ASSAULT - PARTICLE SYSTEM
 * Handles all particle effects and visual effects
 */

const ParticleSystem = {
    particles: [],
    particleGeometry: null,
    particleMaterial: null,
    particleMesh: null,
    scene: null,
    maxParticles: 5000,
    
    init(scene) {
        this.scene = scene;
        
        // Create particle system
        this.particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.maxParticles * 3);
        const colors = new Float32Array(this.maxParticles * 3);
        
        this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        this.particleMaterial = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            sizeAttenuation: true
        });
        
        this.particleMesh = new THREE.Points(this.particleGeometry, this.particleMaterial);
        scene.add(this.particleMesh);
    },
    
    spawnExplosion(position, intensity = 1) {
        const particleCount = Math.floor(30 * intensity);
        for (let i = 0; i < particleCount; i++) {
            const velocity = Utils.randomVector(3 + Math.random() * 2);
            velocity.y += 1;
            
            const life = 0.3 + Math.random() * 0.7;
            const color = new THREE.Color().setHSL(
                (20 + Math.random() * 40) / 360,
                1,
                0.4 + Math.random() * 0.4
            );
            
            this.particles.push({
                position: position.clone(),
                velocity: velocity,
                acceleration: new THREE.Vector3(0, -15, 0),
                color: color,
                life: life,
                maxLife: life,
                type: 'explosion'
            });
        }
    },
    
    spawnMuzzleFlash(position, direction) {
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const spread = Math.random() * 0.3;
            const velocity = direction.clone().multiplyScalar(2);
            velocity.applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.random() - 0.5);
            
            this.particles.push({
                position: position.clone(),
                velocity: velocity,
                acceleration: new THREE.Vector3(0, -5, 0),
                color: new THREE.Color(0xffaa00),
                life: 0.05 + Math.random() * 0.1,
                maxLife: 0.15,
                type: 'muzzleFlash'
            });
        }
    },
    
    spawnSmoke(position, velocity = null) {
        const particleCount = 15;
        for (let i = 0; i < particleCount; i++) {
            const v = velocity ? velocity.clone() : new THREE.Vector3(0, 1, 0);
            v.add(Utils.randomVector(0.5));
            
            this.particles.push({
                position: position.clone(),
                velocity: v,
                acceleration: new THREE.Vector3(0, 0.5, 0),
                color: new THREE.Color(0x666666),
                life: 1 + Math.random() * 1.5,
                maxLife: 2,
                type: 'smoke',
                size: 0.3 + Math.random() * 0.4
            });
        }
    },
    
    spawnBlood(position, velocity) {
        const particleCount = 12;
        for (let i = 0; i < particleCount; i++) {
            const v = velocity.clone().multiplyScalar(0.5 + Math.random() * 0.5);
            
            this.particles.push({
                position: position.clone(),
                velocity: v,
                acceleration: new THREE.Vector3(0, -9.8, 0),
                color: new THREE.Color(0x8b0000),
                life: 0.5 + Math.random() * 0.5,
                maxLife: 1,
                type: 'blood'
            });
        }
    },
    
    spawnSparks(position, velocity, count = 5) {
        for (let i = 0; i < count; i++) {
            const v = velocity.clone().multiplyScalar(0.7 + Math.random() * 0.3);
            v.add(Utils.randomVector(1));
            
            this.particles.push({
                position: position.clone(),
                velocity: v,
                acceleration: new THREE.Vector3(0, -15, 0),
                color: new THREE.Color(0xffff00),
                life: 0.2 + Math.random() * 0.3,
                maxLife: 0.5,
                type: 'spark',
                size: 0.1
            });
        }
    },
    
    update(deltaTime) {
        // Update and render particles
        this.particles = this.particles.filter(p => p.life > 0);
        
        for (let p of this.particles) {
            p.velocity.add(p.acceleration.clone().multiplyScalar(deltaTime));
            p.position.add(p.velocity.clone().multiplyScalar(deltaTime));
            p.life -= deltaTime;
        }
        
        // Update particle geometry
        const positions = this.particleGeometry.attributes.position.array;
        const colors = this.particleGeometry.attributes.color.array;
        
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            positions[i * 3] = p.position.x;
            positions[i * 3 + 1] = p.position.y;
            positions[i * 3 + 2] = p.position.z;
            
            const alpha = p.life / p.maxLife;
            colors[i * 3] = p.color.r * alpha;
            colors[i * 3 + 1] = p.color.g * alpha;
            colors[i * 3 + 2] = p.color.b * alpha;
        }
        
        this.particleGeometry.attributes.position.needsUpdate = true;
        this.particleGeometry.attributes.color.needsUpdate = true;
        this.particleGeometry.setDrawRange(0, this.particles.length);
    }
};
