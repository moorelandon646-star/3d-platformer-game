class FPSController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    
    // Movement
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    
    // Physics
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.speed = 0.15;
    this.sprintSpeed = 0.25;
    this.jumpForce = 0.5;
    this.gravity = -0.02;
    this.isGrounded = false;
    this.groundDamping = 0.8;
    
    // Mouse look
    this.pitch = 0;
    this.yaw = 0;
    this.sensitivity = 0.002;
    this.isLocked = false;
    
    // Sprint
    this.isSprinting = false;
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mousedown', () => {
      this.domElement.requestPointerLock = this.domElement.requestPointerLock || this.domElement.mozRequestPointerLock;
      this.domElement.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
  }
  
  onPointerLockChange() {
    this.isLocked = document.pointerLockElement === this.domElement;
  }
  
  onKeyDown(e) {
    const key = e.key.toLowerCase();
    if (key === 'w') this.moveForward = true;
    if (key === 's') this.moveBackward = true;
    if (key === 'a') this.moveLeft = true;
    if (key === 'd') this.moveRight = true;
    if (key === ' ') {
      if (this.isGrounded) {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
      }
    }
    if (key === 'shift') this.isSprinting = true;
  }
  
  onKeyUp(e) {
    const key = e.key.toLowerCase();
    if (key === 'w') this.moveForward = false;
    if (key === 's') this.moveBackward = false;
    if (key === 'a') this.moveLeft = false;
    if (key === 'd') this.moveRight = false;
    if (key === 'shift') this.isSprinting = false;
  }
  
  onMouseMove(e) {
    if (!this.isLocked) return;
    
    this.yaw -= e.movementX * this.sensitivity;
    this.pitch -= e.movementY * this.sensitivity;
    
    // Clamp pitch
    this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
    
    // Apply rotation
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }
  
  update() {
    const currentSpeed = this.isSprinting ? this.sprintSpeed : this.speed;
    
    this.direction.z = (this.moveForward ? 1 : 0) - (this.moveBackward ? 1 : 0);
    this.direction.x = (this.moveRight ? 1 : 0) - (this.moveLeft ? 1 : 0);
    this.direction.normalize();
    
    // Apply forward/backward and strafe
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    
    this.velocity.x = (forward.x * this.direction.z + right.x * this.direction.x) * currentSpeed;
    this.velocity.z = (forward.z * this.direction.z + right.z * this.direction.x) * currentSpeed;
    
    // Apply gravity
    this.velocity.y += this.gravity;
    
    // Ground collision (simplified)
    if (this.camera.position.y <= 1.6) {
      this.camera.position.y = 1.6;
      this.velocity.y *= this.groundDamping;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }
    
    // Apply velocity
    this.camera.position.addScaledVector(this.velocity, 1);
    
    // Boundary checks
    this.camera.position.x = Math.max(-100, Math.min(100, this.camera.position.x));
    this.camera.position.z = Math.max(-100, Math.min(100, this.camera.position.z));
  }
}