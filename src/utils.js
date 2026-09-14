/**
 * TACTICAL ASSAULT - UTILITY FUNCTIONS
 * Helper functions for math, geometry, and common operations
 */

const Utils = {
    // Vector operations
    vec3: (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z),
    vec2: (x = 0, y = 0) => new THREE.Vector2(x, y),
    
    // Euler angles
    euler: (x = 0, y = 0, z = 0, order = 'XYZ') => new THREE.Euler(x, y, z, order),
    
    // Distance calculation
    distance: (v1, v2) => v1.distanceTo(v2),
    
    // Angle between vectors
    angleBetween: (v1, v2) => v1.angleTo(v2),
    
    // Lerp (linear interpolation)
    lerp: (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t)),
    lerpVector: (v1, v2, t) => {
        const result = v1.clone();
        result.lerp(v2, Math.max(0, Math.min(1, t)));
        return result;
    },
    
    // Clamp value
    clamp: (val, min, max) => Math.max(min, Math.min(max, val)),
    
    // Random number
    random: (min, max) => Math.random() * (max - min) + min,
    randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    
    // Random vector
    randomVector: (length = 1) => {
        const v = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).normalize();
        return v.multiplyScalar(length);
    },
    
    // Raycast from camera
    raycast: (camera, mouse, scene) => {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        return raycaster;
    },
    
    // Check if point is in view frustum
    isInViewFrustum: (camera, position) => {
        const frustum = new THREE.Frustum();
        frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(
            camera.projectionMatrix,
            camera.matrixWorldInverse
        ));
        return frustum.containsPoint(position);
    },
    
    // Smooth step interpolation
    smoothstep: (edge0, edge1, x) => {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    },
    
    // Ease out cubic
    easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
    
    // Ease in cubic
    easeInCubic: (t) => t * t * t,
    
    // Ease in out cubic
    easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    
    // Color conversion
    hexToRgb: (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : null;
    },
    
    // Store settings to localStorage
    saveSetting: (key, value) => {
        localStorage.setItem(`tactical_${key}`, JSON.stringify(value));
    },
    
    // Load settings from localStorage
    loadSetting: (key, defaultValue) => {
        const stored = localStorage.getItem(`tactical_${key}`);
        return stored ? JSON.parse(stored) : defaultValue;
    },
    
    // Clear all settings
    clearSettings: () => {
        for (let key in localStorage) {
            if (key.startsWith('tactical_')) {
                localStorage.removeItem(key);
            }
        }
    }
};
