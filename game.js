/**
 * TACTICAL ASSAULT - MAIN GAME FILE
 * Application entry point and initialization
 */

// Wait for THREE.js to load
function initGame() {
    // Three.js scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 150, 200);
    
    // Camera
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    
    // Renderer
    const canvas = document.getElementById('gameCanvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    renderer.shadowMap.autoUpdate = true;
    
    // Initialize managers
    GameManager.init(scene, camera, renderer);
    UI.init();
    
    // Show main menu
    UI.showMainMenu();
    UI.hideLoadingScreen();
    
    // Keyboard input for ESC to pause
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Escape') {
            if (GameManager.state === 'playing') {
                GameManager.pauseGame();
            } else if (GameManager.state === 'paused') {
                GameManager.resumeGame();
            }
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Animation loop
    let lastFrameTime = performance.now();
    function animate() {
        requestAnimationFrame(animate);
        
        const now = performance.now();
        const deltaTime = Math.min((now - lastFrameTime) / 1000, 0.016);
        lastFrameTime = now;
        
        // Update game
        GameManager.update();
        
        // Render
        renderer.render(scene, camera);
    }
    
    animate();
}

// Check if Three.js is loaded, then initialize
function checkThreeJSAndInit() {
    if (typeof THREE !== 'undefined') {
        initGame();
    } else {
        setTimeout(checkThreeJSAndInit, 100);
    }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkThreeJSAndInit);
} else {
    checkThreeJSAndInit();
}
