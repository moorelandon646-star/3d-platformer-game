// Three.js Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 100, 1000);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 10, 20);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowShadowMap;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 50, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(200, 200);
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Player
const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 3, 0);
player.castShadow = true;
player.receiveShadow = true;
scene.add(player);

// Player physics
const playerState = {
    position: { x: 0, y: 3, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    isJumping: false,
    speed: 0.5,
    jumpForce: 0.8,
    gravity: 0.02
};

// Platforms
const platforms = [
    { x: 15, y: 5, z: 0, width: 10, height: 1, depth: 10 },
    { x: -15, y: 7, z: 0, width: 10, height: 1, depth: 10 },
    { x: 0, y: 9, z: 15, width: 10, height: 1, depth: 10 },
    { x: 0, y: 6, z: -15, width: 10, height: 1, depth: 10 }
];

const platformMeshes = [];
platforms.forEach(platformData => {
    const geometry = new THREE.BoxGeometry(platformData.width, platformData.height, platformData.depth);
    const material = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const platform = new THREE.Mesh(geometry, material);
    platform.position.set(platformData.x, platformData.y, platformData.z);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);
    platformMeshes.push({
        mesh: platform,
        ...platformData
    });
});

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Collision detection
function checkCollision(playerPos, platform) {
    const playerRadius = 0.7;
    const platformHalfWidth = platform.width / 2;
    const platformHalfDepth = platform.depth / 2;
    const platformTop = platform.y + platform.height / 2;

    return (
        playerPos.x > platform.x - platformHalfWidth - playerRadius &&
        playerPos.x < platform.x + platformHalfWidth + playerRadius &&
        playerPos.z > platform.z - platformHalfDepth - playerRadius &&
        playerPos.z < platform.z + platformHalfDepth + playerRadius &&
        playerPos.y > platformTop - playerRadius &&
        playerPos.y < platformTop + 2
    );
}

// Game loop
function animate() {
    requestAnimationFrame(animate);

    // Player movement
    if (keys['w']) playerState.velocity.z -= playerState.speed;
    if (keys['s']) playerState.velocity.z += playerState.speed;
    if (keys['a']) playerState.velocity.x -= playerState.speed;
    if (keys['d']) playerState.velocity.x += playerState.speed;

    // Jump
    if (keys[' '] && !playerState.isJumping) {
        playerState.velocity.y = playerState.jumpForce;
        playerState.isJumping = true;
    }

    // Apply gravity
    playerState.velocity.y -= playerState.gravity;

    // Update position
    playerState.position.x += playerState.velocity.x;
    playerState.position.y += playerState.velocity.y;
    playerState.position.z += playerState.velocity.z;

    // Friction
    playerState.velocity.x *= 0.9;
    playerState.velocity.z *= 0.9;

    // Platform collision
    let onGround = playerState.position.y <= 2;
    platformMeshes.forEach(platform => {
        if (checkCollision(playerState.position, platform)) {
            playerState.position.y = platform.y + platform.height / 2 + 1;
            playerState.velocity.y = 0;
            playerState.isJumping = false;
            onGround = true;
        }
    });

    // Ground collision
    if (playerState.position.y <= 1) {
        playerState.position.y = 1;
        playerState.velocity.y = 0;
        playerState.isJumping = false;
    }

    // Fall detection (reset if too low)
    if (playerState.position.y < -50) {
        playerState.position = { x: 0, y: 3, z: 0 };
        playerState.velocity = { x: 0, y: 0, z: 0 };
        playerState.isJumping = false;
    }

    // Update player mesh
    player.position.copy(playerState.position);

    // Update camera to follow player
    const cameraOffset = new THREE.Vector3(0, 5, 15);
    cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0);
    camera.position.lerp(
        new THREE.Vector3(
            playerState.position.x + cameraOffset.x,
            playerState.position.y + cameraOffset.y,
            playerState.position.z + cameraOffset.z
        ),
        0.1
    );
    camera.lookAt(
        playerState.position.x,
        playerState.position.y + 1,
        playerState.position.z
    );

    renderer.render(scene, camera);
}

animate();