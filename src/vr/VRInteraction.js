import * as THREE from 'three';

export class VRInteraction {
    constructor(scene, camera, vrControllers) {
        this.scene = scene;
        this.camera = camera;
        this.vrControllers = vrControllers;
        this.raycaster = new THREE.Raycaster();
        this.interactableObjects = [];
        this.hoveredObject = null;
        this.tempMatrix = new THREE.Matrix4();

        this.controlPanel = null; // Will be set from main app
    }

    setControlPanel(panel) {
        this.controlPanel = panel;
        if (panel) {
            this.interactableObjects = panel.getInteractableObjects();
        }
    }

    update() {
        if (!this.vrControllers) return;

        const controllers = this.vrControllers.getControllers();

        controllers.forEach((controller, index) => {
            this.handleController(controller, index);
        });
    }

    handleController(controller, controllerIndex) {
        if (!controller) return;

        // Set up raycaster from controller position and direction
        this.tempMatrix.identity().extractRotation(controller.matrixWorld);

        this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.tempMatrix);

        // Check for intersections with interactable objects
        const intersects = this.raycaster.intersectObjects(this.interactableObjects, true);

        if (intersects.length > 0) {
            const intersected = this.getTopLevelObject(intersects[0].object);

            // Hover effect
            if (this.hoveredObject !== intersected) {
                this.clearHover();
                this.setHover(intersected);
                this.hoveredObject = intersected;

                // Subtle haptic feedback on hover
                this.vrControllers.triggerHaptic(controllerIndex, 0.3, 50);
            }

            // Handle button press (trigger)
            if (controller.userData.isSelecting && !controller.userData.buttonPressed) {
                controller.userData.buttonPressed = true;
                this.handleInteraction(intersected);

                // Strong haptic feedback on press
                this.vrControllers.triggerHaptic(controllerIndex, 0.8, 100);
            }
        } else {
            // No intersection
            if (this.hoveredObject) {
                this.clearHover();
                this.hoveredObject = null;
            }
        }

        // Reset button state when trigger released
        if (!controller.userData.isSelecting) {
            controller.userData.buttonPressed = false;
        }
    }

    getTopLevelObject(object) {
        // Traverse up to find the top-level interactable object
        let current = object;
        while (current.parent && !current.userData.type) {
            current = current.parent;
        }
        return current;
    }

    setHover(object) {
        if (!object || !object.material) return;

        // Store original material properties
        object.userData.originalEmissive = object.material.emissive ? object.material.emissive.clone() : new THREE.Color(0x000000);
        object.userData.originalEmissiveIntensity = object.material.emissiveIntensity || 0;

        // Highlight
        if (object.material.emissive) {
            object.material.emissive.setHex(0xffffff);
            object.material.emissiveIntensity = 0.5;
        }
    }

    clearHover() {
        if (!this.hoveredObject || !this.hoveredObject.material) return;

        // Restore original material
        if (this.hoveredObject.userData.originalEmissive) {
            this.hoveredObject.material.emissive.copy(this.hoveredObject.userData.originalEmissive);
            this.hoveredObject.material.emissiveIntensity = this.hoveredObject.userData.originalEmissiveIntensity;
        }
    }

    handleInteraction(object) {
        if (!object || !object.userData.type) return;

        console.log('Interacting with:', object.userData.type, object.userData.label);

        // Pass interaction to control panel
        if (this.controlPanel) {
            this.controlPanel.handleButtonPress(object);
        }

        // Visual click feedback
        if (object.material) {
            const originalScale = object.scale.clone();
            object.scale.multiplyScalar(0.9);

            setTimeout(() => {
                object.scale.copy(originalScale);
            }, 100);
        }
    }

    addInteractableObject(object) {
        if (!this.interactableObjects.includes(object)) {
            this.interactableObjects.push(object);
        }
    }

    addInteractableObjects(objects) {
        objects.forEach(obj => this.addInteractableObject(obj));
    }

    removeInteractableObject(object) {
        const index = this.interactableObjects.indexOf(object);
        if (index > -1) {
            this.interactableObjects.splice(index, 1);
        }
    }

    clearInteractableObjects() {
        this.interactableObjects = [];
    }
}
