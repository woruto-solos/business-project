import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

let scene, camera, renderer;
let macbookBase, screenGroup;
let animationProgress = 0;
let isAnimating = true;

function init() {
    const container = document.getElementById('macbook-animation-container');
    if (!container) return;

    scene = new THREE.Scene();
    // Use the parent background color by setting alpha to true in renderer

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(6, 4, 9);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lights
    RectAreaLightUniformsLib.init();
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.6);
    mainLight.position.set(8, 10, 8);
    scene.add(mainLight);

    // Additional area lights
    const rectLight1 = new THREE.RectAreaLight(0xffffff, 2, 4, 4);
    rectLight1.position.set(-5, 5, 5);
    rectLight1.lookAt(0, 0, 0);
    scene.add(rectLight1);

    const rectLight2 = new THREE.RectAreaLight(0x4a90e2, 1.5, 3, 3);
    rectLight2.position.set(5, 4, -3);
    rectLight2.lookAt(0, 0, 0);
    scene.add(rectLight2);

    const fillLight = new THREE.DirectionalLight(0x6ea8ff, 0.3);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    createMacBook();

    // Floor (transparent)
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 30),
        new THREE.MeshStandardMaterial({ color: 0x1a1a2e, transparent: true, opacity: 0 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.6;
    floor.receiveShadow = true;
    scene.add(floor);

    window.addEventListener('resize', () => onWindowResize(container));
    document.getElementById('replay').addEventListener('click', replayAnimation);

    animate();
}

function createMacBook() {
    macbookBase = new THREE.Group();

    const aluminumMaterial = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9, roughness: 0.2 });

    // Bottom base
    const bottomCase = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.15, 2.2), aluminumMaterial);
    bottomCase.castShadow = true;
    bottomCase.receiveShadow = true;
    macbookBase.add(bottomCase);

    // Top case (keyboard area)
    const topCase = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.02, 2.15), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.3 }));
    topCase.position.y = 0.085;
    macbookBase.add(topCase);

    // Keyboard keys
    const keyMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 });
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 14; col++) {
            const key = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, 0.12), keyMaterial);
            key.position.set((col - 6.5) * 0.15, 0.1, (row - 2) * 0.15 - 0.2);
            macbookBase.add(key);
        }
    }

    // Trackpad
    const trackpad = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.01, 0.8), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.3, metalness: 0.4 }));
    trackpad.position.set(0, 0.095, 0.7);
    macbookBase.add(trackpad);

    // Screen group
    screenGroup = new THREE.Group();

    // Screen bezel
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.1, 0.12), aluminumMaterial);
    bezel.castShadow = true;
    bezel.position.y = 1.05;
    screenGroup.add(bezel);

    // Screen display
    const displayBorder = new THREE.Mesh(new THREE.BoxGeometry(3.15, 2.05, 0.01), new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.2 }));
    displayBorder.position.set(0, 1.05, 0.065);
    screenGroup.add(displayBorder);

    const display = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.8), new THREE.MeshStandardMaterial({ color: 0x1e1e1e, emissive: 0x2a4a6a, emissiveIntensity: 0.5, roughness: 0.1 }));
    display.position.set(0, 1.05, 0.071);
    screenGroup.add(display);

    // Apple logo
    const logo = new THREE.Mesh(new THREE.CircleGeometry(0.15, 32), new THREE.MeshStandardMaterial({ color: 0xa0a0a0, metalness: 0.8, roughness: 0.3 }));
    logo.position.set(0, 1.05, -0.061);
    screenGroup.add(logo);

    // Notch
    const notch = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.03, 0.02), new THREE.MeshStandardMaterial({ color: 0x000000 }));
    notch.position.set(0, 2, 0.066);
    screenGroup.add(notch);

    // **Fixed hinge rotation point**
    screenGroup.position.set(0, 0.075, -1.1); // back edge hinge
    screenGroup.rotation.x = Math.PI / 2; // start closed (90°)
    macbookBase.add(screenGroup);

    scene.add(macbookBase);
}

function animate() {
    requestAnimationFrame(animate);

    if (isAnimating) {
        animationProgress += 0.008;

        if (animationProgress <= 1) {
            // Open screen from 90° → 30° smoothly
            const startAngle = Math.PI / 2;
            const endAngle = Math.PI / 6;
            const eased = easeInOutCubic(animationProgress);
            screenGroup.rotation.x = startAngle - eased * (startAngle - endAngle);
        } else if (animationProgress <= 2) {
            const rotProgress = animationProgress - 1;
            macbookBase.rotation.y = easeInOutCubic(rotProgress) * (Math.PI / 6);
        } else {
            isAnimating = false;
        }
    }

    // Subtle floating
    macbookBase.position.y = Math.sin(Date.now() * 0.0008) * 0.08;

    renderer.render(scene, camera);
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function replayAnimation() {
    animationProgress = 0;
    isAnimating = true;
    macbookBase.rotation.y = 0;
    screenGroup.rotation.x = Math.PI / 2; // reset closed
}

function onWindowResize(container) {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

init();