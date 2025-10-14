import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Get a reference to the container
const canvasContainer = document.getElementById('canvas-container');

// 1. Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f8ff);

// 2. Camera
const camera = new THREE.PerspectiveCamera(75, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 1000);
camera.position.z = 7; // Move camera back to accommodate the larger model

// 3. Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
canvasContainer.appendChild(renderer.domElement);

// 4. Lighting
RectAreaLightUniformsLib.init();

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Increased ambient light to make the model brighter
scene.add(ambientLight);

const rectLight1 = new THREE.RectAreaLight(0xffffff, 2, 2, 10); // Reduced intensity from 5 to 2
rectLight1.position.set(5, 5, 5);
rectLight1.lookAt(0, 0, 0);
scene.add(rectLight1);

const rectLight2 = new THREE.RectAreaLight(0xffffff, 3, 2, 10); // Reduced intensity from 8 to 3
rectLight2.position.set(-5, -5, 5);
rectLight2.lookAt(0, 0, 0);
scene.add(rectLight2);

// 5. Phone Model
const phoneModelGroup = new THREE.Group();
scene.add(phoneModelGroup);
phoneModelGroup.scale.set(3, 3, 3); // Scale the entire model group by 3x
// Set initial position for intro animation
phoneModelGroup.position.y = -20;
phoneModelGroup.rotation.x = -Math.PI / 4;

// Phone dimensions
const phoneWidth = 1.5;
const phoneHeight = 3;
const phoneDepth = 0.15;
const radius = 0.15;

// Create phone shape with rounded corners
const phoneShape = new THREE.Shape();
phoneShape.moveTo(-phoneWidth / 2 + radius, -phoneHeight / 2);
phoneShape.lineTo(phoneWidth / 2 - radius, -phoneHeight / 2);
phoneShape.quadraticCurveTo(phoneWidth / 2, -phoneHeight / 2, phoneWidth / 2, -phoneHeight / 2 + radius);
phoneShape.lineTo(phoneWidth / 2, phoneHeight / 2 - radius);
phoneShape.quadraticCurveTo(phoneWidth / 2, phoneHeight / 2, phoneWidth / 2 - radius, phoneHeight / 2);
phoneShape.lineTo(-phoneWidth / 2 + radius, phoneHeight / 2);
phoneShape.quadraticCurveTo(-phoneWidth / 2, phoneHeight / 2, -phoneWidth / 2, phoneHeight / 2 - radius);
phoneShape.lineTo(-phoneWidth / 2, -phoneHeight / 2 + radius);
phoneShape.quadraticCurveTo(-phoneWidth / 2, -phoneHeight / 2, -phoneWidth / 2 + radius, -phoneHeight / 2);

const extrudeSettings = {
    depth: phoneDepth,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 8
};

const phoneGeometry = new THREE.ExtrudeGeometry(phoneShape, extrudeSettings);
const phoneMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Changed phone body to white
    metalness: 0.9,
    roughness: 0.2,
});
const phoneMesh = new THREE.Mesh(phoneGeometry, phoneMaterial);
phoneMesh.position.z = -phoneDepth / 2;
phoneMesh.castShadow = true;
phoneMesh.receiveShadow = true;
phoneModelGroup.add(phoneMesh);

// Screen with image texture
const textureLoader = new THREE.TextureLoader();
const screenGeometry = new THREE.PlaneGeometry(phoneWidth - 0.2, phoneHeight - 0.4);
const screenMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Set to white to show texture color
    metalness: 0.1,
    roughness: 0.1,
});
// Use a placeholder image. Replace the URL with your own image.
textureLoader.load('https://i.redd.it/made-a-wallpaper-hope-you-enjoy-v0-ajrzhkd02sjb1.jpg?width=2304&format=pjpg&auto=webp&s=d863055bdc6cd4aa292751ae32cae1f185178314', (texture) => {
    // Create a canvas to increase contrast
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    const image = texture.image;
    canvas.width = image.width;
    canvas.height = image.height;

    // Apply a 3.5% contrast filter
    context.filter = 'contrast(1.035)';
    context.drawImage(image, 0, 0);

    // Create a new texture from the canvas with increased contrast
    const contrastedTexture = new THREE.CanvasTexture(canvas);
    contrastedTexture.colorSpace = THREE.SRGBColorSpace;

    // Apply the new texture to the screen
    screenMaterial.map = contrastedTexture;
    screenMaterial.needsUpdate = true;
});
const screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
screenMesh.position.z = phoneDepth / 2 + 0.025;
phoneModelGroup.add(screenMesh);

// Notch
const notchGeometry = new THREE.BoxGeometry(0.4, 0.08, 0.05);
const notchMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.3,
    roughness: 0.7
});
const notchMesh = new THREE.Mesh(notchGeometry, notchMaterial);
notchMesh.position.set(0, phoneHeight / 2 - 0.3, phoneDepth / 2 + 0.025);
phoneModelGroup.add(notchMesh);

// Camera module
const cameraPlateGeometry = new THREE.BoxGeometry(0.8, 0.9, 0.04);
const cameraPlateMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a90e2, // Changed camera plate to a complementary blue
    metalness: 0.95,
    roughness: 0.15
});
const cameraPlateMesh = new THREE.Mesh(cameraPlateGeometry, cameraPlateMaterial);
cameraPlateMesh.position.set(0, phoneHeight / 2 - 0.55, -phoneDepth / 2 - 0.02);
phoneModelGroup.add(cameraPlateMesh);

// Side buttons
const buttonGeometry = new THREE.BoxGeometry(0.05, 0.3, 0.08);
const buttonMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Matched button color to the white phone body
    metalness: 0.9,
    roughness: 0.2
});
const powerButton = new THREE.Mesh(buttonGeometry, buttonMaterial);
powerButton.position.set(phoneWidth / 2 + 0.025, 0.5, 0);
phoneModelGroup.add(powerButton);

const volumeButton = new THREE.Mesh(buttonGeometry, buttonMaterial);
volumeButton.position.set(-phoneWidth / 2 - 0.025, 0.5, 0);
phoneModelGroup.add(volumeButton);

// 6. Interaction
let mouseX = 0;
let mouseY = 0;

function onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1) for both axes
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}
// We will add this listener after the intro animation

// 7. Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Only apply mouse-move rotation if the listener is active
    if (window.isMouseInteractionActive) {
        const targetRotationY = mouseX * 0.4;
        const targetRotationX = mouseY * 0.25;
        phoneModelGroup.rotation.y += (targetRotationY - phoneModelGroup.rotation.y) * 0.08;
        phoneModelGroup.rotation.x += (targetRotationX - phoneModelGroup.rotation.x) * 0.08;
    }

    renderer.render(scene, camera);
}

// 8. Handle Window Resizing
function onWindowResize() {
    // Update camera aspect ratio based on container
    camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
    camera.updateProjectionMatrix();

    // Update renderer size
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
window.addEventListener('resize', onWindowResize);

// 9. Intro Animation Timeline
function runIntroAnimation() {
    const tl = gsap.timeline({
        onComplete: () => {
            // Enable mouse interaction after animation completes
            window.isMouseInteractionActive = true;
            window.addEventListener('mousemove', onMouseMove);
        }
    });

    // Animate the phone into view
    tl.to(phoneModelGroup.position, { y: 0, duration: 2, ease: 'power3.out' }, 0);
    tl.to(phoneModelGroup.rotation, { x: 0, duration: 2, ease: 'power3.out' }, 0);

    // Animate the UI elements spawning in
    tl.to('.ct-hero-title', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 1);
    tl.to('.ct-hero-sub', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 1.2);
    tl.to('.ct-btn--primary', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 1.4);
}

// 10. Scroll-based Animation
function setupScrollAnimation() {
    gsap.registerPlugin(ScrollTrigger);

    const scrollTl = gsap.timeline({
        scrollTrigger: {
            trigger: ".ct-hero-surface",
            start: "top top",
            end: "bottom top",
            scrub: 1, // Smoothly scrub through the animation
            onEnter: () => { window.isMouseInteractionActive = true; },
            onLeave: () => { window.isMouseInteractionActive = false; },
            onEnterBack: () => { window.isMouseInteractionActive = true; },
            onLeaveBack: () => { window.isMouseInteractionActive = false; },
        }
    });

    // Define the "turn around" animation
    scrollTl.to(phoneModelGroup.rotation, { y: Math.PI }, 0); // Rotate 180 degrees
    scrollTl.to(phoneModelGroup.position, { x: -10 }, 0); // Move to the left
    scrollTl.to(phoneModelGroup.scale, { x: 2, y: 2, z: 2 }, 0); // Shrink slightly

    // Fade out the hero text as we scroll
    gsap.to('.ct-hero-content', {
        opacity: 0,
        scrollTrigger: {
            trigger: ".ct-hero-surface",
            start: "center center",
            end: "bottom center",
            scrub: true,
        }
    });
}

// 11. Feature Demo Interaction
function setupFeatureDemo() {
    const container = document.getElementById('cube-demo-canvas-container');
    const modeSwitch = document.getElementById('mode-switch');
    if (!container || !modeSwitch) return;

    // 1. Scene Setup
    const demoScene = new THREE.Scene();
    const demoCamera = new THREE.PerspectiveCamera(10, container.clientWidth / container.clientHeight, 0.1, 1000);
    const demoRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    demoRenderer.setSize(container.clientWidth, container.clientHeight);
    demoRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(demoRenderer.domElement);

    // 2. Lighting
    const demoAmbient = new THREE.AmbientLight(0xffffff, 0.6);
    demoScene.add(demoAmbient);
    const demoDirectional = new THREE.DirectionalLight(0xffffff, 1);
    demoDirectional.position.set(5, 5, 5);
    demoScene.add(demoDirectional);

    // 3. Cube
    const cubeSize = 2.5;
    const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const cubeMaterial = new THREE.MeshStandardMaterial({
        color: '#2f7cf5',
        metalness: 0.1,
        roughness: 0.5
    });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    demoScene.add(cube);

    // 4. Controls
    const controls = new OrbitControls(demoCamera, demoRenderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enabled = false; // Disabled by default

    // 5. Initial "2D" State - Calculate the perfect camera distance
    // This formula ensures the cube's height perfectly matches the canvas height in the initial view
    const fovInRadians = (demoCamera.fov * Math.PI) / 180;
    const cameraDistance = (cubeSize / 2) / Math.tan(fovInRadians / 2);
    demoCamera.position.z = cameraDistance;

    // 6. Animation Loop for this specific scene
    function demoAnimate() {
        requestAnimationFrame(demoAnimate);
        if (controls.enabled) {
            controls.update();
        }
        demoRenderer.render(demoScene, demoCamera);
    }
    demoAnimate();

    // 7. Interaction Logic
    let is3D = false;
    const timeline = gsap.timeline({ paused: true });
    timeline
        .to(demoCamera, { fov: 50, duration: 1, ease: 'power3.inOut' }, 0)
        .to(demoCamera.position, { z: 5.5, duration: 1, ease: 'power3.inOut' }, 0)
        .to(cube.rotation, { x: Math.PI * 0.25, y: Math.PI * 0.25, duration: 1, ease: 'power3.inOut' }, 0);

    modeSwitch.addEventListener('change', () => {
        is3D = modeSwitch.checked;
        if (is3D) {
            document.body.classList.add('dark-mode');
            gsap.to(scene.background, { r: 0x0a / 255, g: 0x0a / 255, b: 0x0a / 255, duration: 1 });
            timeline.play();
            controls.enabled = true;
        } else {
            document.body.classList.remove('dark-mode');
            gsap.to(scene.background, { r: 0xf0 / 255, g: 0xf8 / 255, b: 0xff / 255, duration: 1 });
            timeline.reverse();
            controls.enabled = false;
            // Reset controls and camera to initial state when animation finishes reversing
            gsap.to(controls.target, { 
                x: 0, y: 0, z: 0, 
                duration: 0.5, 
                onComplete: () => controls.reset() 
            });
        }
    });

    // Handle resize for this specific canvas
    const demoResizeObserver = new ResizeObserver(() => {
        demoCamera.aspect = container.clientWidth / container.clientHeight;
        demoCamera.updateProjectionMatrix();
        demoRenderer.setSize(container.clientWidth, container.clientHeight);
    });
    demoResizeObserver.observe(container);
}

// Start the main animation loop and then the intro animation
animate();
runIntroAnimation();
setupScrollAnimation();
setupFeatureDemo();