import * as THREE from 'three';

export class VRControllers {
    constructor(renderer, scene) {
        this.renderer = renderer;
        this.scene = scene;
        this.controllers = [];
        this.controllerGrips = [];
        this.controllerModels = [];

        this.setupControllers();
    }

    setupControllers() {
        // Controller 0 (typically right hand)
        const controller0 = this.renderer.xr.getController(0);
        controller0.userData.hand = 'right';
        controller0.addEventListener('selectstart', this.onSelectStart.bind(this));
        controller0.addEventListener('selectend', this.onSelectEnd.bind(this));
        controller0.addEventListener('squeezestart', this.onSqueezeStart.bind(this));
        controller0.addEventListener('squeezeend', this.onSqueezeEnd.bind(this));
        this.scene.add(controller0);
        this.controllers.push(controller0);

        // Controller 1 (typically left hand)
        const controller1 = this.renderer.xr.getController(1);
        controller1.userData.hand = 'left';
        controller1.addEventListener('selectstart', this.onSelectStart.bind(this));
        controller1.addEventListener('selectend', this.onSelectEnd.bind(this));
        controller1.addEventListener('squeezestart', this.onSqueezeStart.bind(this));
        controller1.addEventListener('squeezeend', this.onSqueezeEnd.bind(this));
        this.scene.add(controller1);
        this.controllers.push(controller1);

        // Add visual ray for pointing
        this.createControllerRays();

        // Controller grips (visual representation)
        const controllerModelFactory = this.createBasicControllerModel();

        const grip0 = this.renderer.xr.getControllerGrip(0);
        grip0.add(controllerModelFactory.clone());
        this.scene.add(grip0);
        this.controllerGrips.push(grip0);

        const grip1 = this.renderer.xr.getControllerGrip(1);
        grip1.add(controllerModelFactory.clone());
        this.scene.add(grip1);
        this.controllerGrips.push(grip1);
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

        // Trigger curve
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

        // A/B buttons
        const buttonGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.005, 16);
        const buttonA = new THREE.Mesh(buttonGeometry, new THREE.MeshStandardMaterial({ color: 0x0066ff }));
        buttonA.position.set(0.015, 0.04, -0.08);
        buttonA.rotation.x = Math.PI / 2;
        group.add(buttonA);

        const buttonB = new THREE.Mesh(buttonGeometry, new THREE.MeshStandardMaterial({ color: 0xff6600 }));
        buttonB.position.set(0.015, 0.04, -0.095);
        buttonB.rotation.x = Math.PI / 2;
        group.add(buttonB);

        return group;
    }

    onSelectStart(event) {
        const controller = event.target;
        controller.userData.isSelecting = true;

        // Pulse haptic feedback
        if (controller.gamepad && controller.gamepad.hapticActuators) {
            controller.gamepad.hapticActuators[0].pulse(0.6, 100);
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

    update() {
        // Update controller states, handle input
        this.controllers.forEach(controller => {
            if (controller.userData.isSelecting) {
                // Visual feedback - brighten ray
                const ray = controller.getObjectByName('ray');
                if (ray && ray.material) {
                    ray.material.opacity = 1.0;
                }
            } else {
                const ray = controller.getObjectByName('ray');
                if (ray && ray.material) {
                    ray.material.opacity = 0.7;
                }
            }
        });
    }

    getControllers() {
        return this.controllers;
    }

    getController(index) {
        return this.controllers[index];
    }

    triggerHaptic(controllerIndex, intensity = 0.5, duration = 100) {
        const controller = this.controllers[controllerIndex];
        if (controller && controller.gamepad && controller.gamepad.hapticActuators) {
            controller.gamepad.hapticActuators[0].pulse(intensity, duration);
        }
    }
}
