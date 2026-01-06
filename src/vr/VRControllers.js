import * as THREE from 'three';

export class VRControllers {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.controllers = [];
        this.controllerGrips = [];
        this.controllerModels = [];

        // Locomotion Settings
        this.moveSpeed = 2.0; // m/s
        this.rotationSpeed = 2.0; // rad/s (for smooth turn, if added)
        this.deadzone = 0.15;

        // Create Dolly (User Rig)
        // This group represents the user's position in the world.
        // We move this group to simulate locomotion.
        this.dolly = new THREE.Group();
        // Initial VR Standing Position (in front of machine)
        this.dolly.position.set(2.0, 0, 4.0);
        this.scene.add(this.dolly);

        this.setupControllers();

        // Handle VR Session Events to Manage Camera Parenting
        this.renderer.xr.addEventListener('sessionstart', this.onSessionStart.bind(this));
        this.renderer.xr.addEventListener('sessionend', this.onSessionEnd.bind(this));
    }

    onSessionStart() {
        // Move camera into the Dolly for VR Locomotion
        this.dolly.add(this.camera);
        // Reset Dolly to start position if desired, or keep last
        this.dolly.position.set(2.0, 0, 4.0);
    }

    onSessionEnd() {
        // Return camera to the Scene for Non-VR OrbitControls
        this.scene.add(this.camera);
        // Reset camera position to a nice default for desktop? 
        // Or let OrbitControls handle it (it usually keeps last state).
        this.camera.position.set(2.5, 2.0, 3.5);
        this.camera.rotation.set(0, 0, 0); // Reset rotation to avoid skewed view
    }

    setupControllers() {
        // Controller 0 (Right Hand typically, but depends on system)
        const controller0 = this.renderer.xr.getController(0);
        controller0.userData.hand = 'unknown'; // Will be updated by connection event
        controller0.addEventListener('selectstart', this.onSelectStart.bind(this));
        controller0.addEventListener('selectend', this.onSelectEnd.bind(this));
        controller0.addEventListener('squeezestart', this.onSqueezeStart.bind(this));
        controller0.addEventListener('squeezeend', this.onSqueezeEnd.bind(this));
        controller0.addEventListener('connected', this.onControllerConnected.bind(this));

        this.dolly.add(controller0); // Add to Dolly
        this.controllers.push(controller0);

        // Controller 1 (Left Hand typically)
        const controller1 = this.renderer.xr.getController(1);
        controller1.userData.hand = 'unknown';
        controller1.addEventListener('selectstart', this.onSelectStart.bind(this));
        controller1.addEventListener('selectend', this.onSelectEnd.bind(this));
        controller1.addEventListener('squeezestart', this.onSqueezeStart.bind(this));
        controller1.addEventListener('squeezeend', this.onSqueezeEnd.bind(this));
        controller1.addEventListener('connected', this.onControllerConnected.bind(this));

        this.dolly.add(controller1); // Add to Dolly
        this.controllers.push(controller1);

        // Add visual ray for pointing
        this.createControllerRays();

        // Controller grips (visual representation)
        const controllerModelFactory = this.createBasicControllerModel();

        const grip0 = this.renderer.xr.getControllerGrip(0);
        grip0.add(controllerModelFactory.clone());
        this.dolly.add(grip0); // Add to Dolly
        this.controllerGrips.push(grip0);

        const grip1 = this.renderer.xr.getControllerGrip(1);
        grip1.add(controllerModelFactory.clone());
        this.dolly.add(grip1); // Add to Dolly
        this.controllerGrips.push(grip1);
    }

    onControllerConnected(event) {
        const controller = event.target;
        const inputSource = event.data;
        if (inputSource) {
            controller.userData.inputSource = inputSource;
            if (inputSource.handedness) {
                controller.userData.hand = inputSource.handedness; // 'left' or 'right'
            }
        }
    }

    createControllerRays() {
        // Create pointing ray visual
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -1)
        ]);

        const material = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            linewidth: 2,
            opacity: 0.7,
            transparent: true
        });

        this.controllers.forEach(controller => {
            const line = new THREE.Line(geometry, material);
            line.name = 'ray';
            line.scale.z = 5; // Extend ray length
            controller.add(line);
        });
    }

    createBasicControllerModel() {
        // Simple controller model (Quest-style)
        const group = new THREE.Group();

        // Controller body
        const bodyGeometry = new THREE.BoxGeometry(0.05, 0.12, 0.15);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.7,
            metalness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.z = -0.06;
        group.add(body);

        // Trigger curve (Simple Box)
        const triggerGeometry = new THREE.BoxGeometry(0.03, 0.04, 0.06);
        const triggerMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.6
        });
        const trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
        trigger.position.set(0, -0.03, -0.02);
        group.add(trigger);

        // Grip button
        const gripGeometry = new THREE.BoxGeometry(0.02, 0.06, 0.03);
        const grip = new THREE.Mesh(gripGeometry, triggerMaterial);
        grip.position.set(0.03, -0.02, -0.08);
        group.add(grip);

        // Thumbstick
        const stickGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.015, 16);
        const stickMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.5
        });
        const stick = new THREE.Mesh(stickGeometry, stickMaterial);
        stick.position.set(0, 0.04, -0.05);
        stick.rotation.x = Math.PI / 2;
        group.add(stick);

        return group;
    }

    onSelectStart(event) {
        const controller = event.target;
        controller.userData.isSelecting = true;

        // Pulse haptic feedback
        if (controller.userData.inputSource && controller.userData.inputSource.gamepad && controller.userData.inputSource.gamepad.hapticActuators) {
            const haptic = controller.userData.inputSource.gamepad.hapticActuators[0];
            if (haptic) haptic.pulse(0.6, 100);
        }
    }

    onSelectEnd(event) {
        const controller = event.target;
        controller.userData.isSelecting = false;
    }

    onSqueezeStart(event) {
        const controller = event.target;
        controller.userData.isSqueezing = true;
    }

    onSqueezeEnd(event) {
        const controller = event.target;
        controller.userData.isSqueezing = false;
    }

    // Called every frame
    update() {
        const dt = 0.015; // Approximation

        // --- Handle Input & Visuals ---
        this.controllers.forEach(controller => {
            // Visual Ray Feedback
            if (controller.userData.isSelecting) {
                const ray = controller.getObjectByName('ray');
                if (ray && ray.material) ray.material.opacity = 1.0;
            } else {
                const ray = controller.getObjectByName('ray');
                if (ray && ray.material) ray.material.opacity = 0.7;
            }

            // --- SMOOTH LOCOMOTION LOGIC ---
            this.handleControllerLocomotion(controller, dt);
        });
    }

    handleControllerLocomotion(controller, dt) {
        const inputSource = controller.userData.inputSource;
        if (!inputSource || !inputSource.gamepad) return;

        const gamepad = inputSource.gamepad;

        // Use LEFT hand for Locomotion (Movement)
        if (gamepad.axes.length < 4) return;

        const axesX = gamepad.axes[2];
        const axesY = gamepad.axes[3];

        // Deadzone check
        if (Math.abs(axesX) < this.deadzone && Math.abs(axesY) < this.deadzone) return;

        if (inputSource.handedness === 'left') {
            // --- MOVEMENT (Left Hand) ---

            // Get Camera Yaw (Flat Forward Direction)
            const forward = new THREE.Vector3();
            if (this.camera) {
                this.camera.getWorldDirection(forward);
                forward.y = 0;
                forward.normalize();

                if (forward.lengthSq() < 0.001) {
                    forward.set(0, 0, -1);
                }
            } else {
                forward.set(0, 0, -1);
            }

            const right = new THREE.Vector3();
            right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

            // Calculate Movement Vector
            const moveVec = new THREE.Vector3();
            // Up on stick (negative axesY) should move Forward
            moveVec.addScaledVector(forward, -axesY);
            // Right on stick (positive axesX) should move Right
            moveVec.addScaledVector(right, axesX);

            moveVec.normalize();

            // Apply Speed and Time
            const magnitude = Math.sqrt(axesX * axesX + axesY * axesY);
            moveVec.multiplyScalar(this.moveSpeed * magnitude * dt);

            // Move Dolly
            this.dolly.position.add(moveVec);
        }
    }

    getControllers() {
        return this.controllers;
    }

    getController(index) {
        return this.controllers[index];
    }

    triggerHaptic(controllerIndex, intensity = 0.5, duration = 100) {
        const controller = this.controllers[controllerIndex];
        // Updated to use saved inputSource or check basic gamepad
        if (controller && controller.userData.inputSource && controller.userData.inputSource.gamepad && controller.userData.inputSource.gamepad.hapticActuators) {
            const haptic = controller.userData.inputSource.gamepad.hapticActuators[0];
            if (haptic) haptic.pulse(intensity, duration);
        } else if (controller && controller.gamepad && controller.gamepad.hapticActuators) {
            controller.gamepad.hapticActuators[0].pulse(intensity, duration);
        }
    }
}
