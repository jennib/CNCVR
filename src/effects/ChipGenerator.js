import * as THREE from 'three';

export class ChipGenerator {
    constructor(scene) {
        this.scene = scene;
        this.chips = [];
        this.maxChips = 500; // Limit for performance
        this.chipGeometry = null;
        this.chipMaterials = {};

        this.createChipGeometry();
        this.createMaterials();
    }

    createChipGeometry() {
        // Small chip particle geometry
        this.chipGeometry = new THREE.BoxGeometry(0.002, 0.001, 0.003);
    }

    createMaterials() {
        // Different materials for different metals
        this.chipMaterials = {
            aluminum: new THREE.MeshStandardMaterial({
                color: 0xc0c0c0,
                metalness: 0.9,
                roughness: 0.4,
                emissive: 0x404040,
                emissiveIntensity: 0.2
            }),
            steel: new THREE.MeshStandardMaterial({
                color: 0x888888,
                metalness: 0.95,
                roughness: 0.5,
                emissive: 0x302010,
                emissiveIntensity: 0.3
            }),
            brass: new THREE.MeshStandardMaterial({
                color: 0xb5a642,
                metalness: 0.85,
                roughness: 0.3
            })
        };
    }

    generateChips(position, direction, materialType = 'aluminum', count = 5) {
        const material = this.chipMaterials[materialType] || this.chipMaterials.aluminum;

        for (let i = 0; i < count; i++) {
            // Don't exceed max chips
            if (this.chips.length >= this.maxChips) {
                // Remove oldest chip
                const oldChip = this.chips.shift();
                this.scene.remove(oldChip.mesh);
                oldChip.mesh.geometry.dispose();
            }

            const chip = {
                mesh: new THREE.Mesh(this.chipGeometry, material),
                velocity: new THREE.Vector3(),
                angularVelocity: new THREE.Vector3(),
                age: 0,
                maxAge: 3.0 // Seconds before fading
            };

            // Position at cutting point
            chip.mesh.position.copy(position);
            chip.mesh.castShadow = true;

            // Random ejection velocity based on cutting direction
            const baseVelocity = direction.clone().multiplyScalar(0.5);
            chip.velocity.copy(baseVelocity);
            chip.velocity.x += (Math.random() - 0.5) * 0.3;
            chip.velocity.y += Math.random() * 0.5 + 0.2; // Upward
            chip.velocity.z += (Math.random() - 0.5) * 0.3;

            // Random rotation
            chip.angularVelocity.set(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );

            this.chips.push(chip);
            this.scene.add(chip.mesh);
        }
    }

    update(delta) {
        const gravity = new THREE.Vector3(0, -9.8, 0);
        const damping = 0.98;
        const floorY = 0.05; // Slight above actual floor

        this.chips.forEach((chip, index) => {
            chip.age += delta;

            // Physics update
            chip.velocity.add(gravity.clone().multiplyScalar(delta));
            chip.velocity.multiplyScalar(damping);

            chip.mesh.position.add(chip.velocity.clone().multiplyScalar(delta));

            // Rotation
            chip.mesh.rotation.x += chip.angularVelocity.x * delta;
            chip.mesh.rotation.y += chip.angularVelocity.y * delta;
            chip.mesh.rotation.z += chip.angularVelocity.z * delta;

            // Floor collision
            if (chip.mesh.position.y < floorY) {
                chip.mesh.position.y = floorY;
                chip.velocity.y *= -0.3; // Bounce
                chip.velocity.multiplyScalar(0.7); // Lose energy
                chip.angularVelocity.multiplyScalar(0.5);
            }

            // Fade out old chips
            if (chip.age > chip.maxAge * 0.8) {
                const fadeProgress = (chip.age - chip.maxAge * 0.8) / (chip.maxAge * 0.2);
                chip.mesh.material.opacity = 1.0 - fadeProgress;
                chip.mesh.material.transparent = true;
            }

            // Remove very old chips
            if (chip.age > chip.maxAge) {
                this.scene.remove(chip.mesh);
                this.chips.splice(index, 1);
            }
        });
    }

    clear() {
        this.chips.forEach(chip => {
            this.scene.remove(chip.mesh);
            chip.mesh.geometry.dispose();
        });
        this.chips = [];
    }

    dispose() {
        this.clear();
        if (this.chipGeometry) {
            this.chipGeometry.dispose();
        }
        Object.values(this.chipMaterials).forEach(mat => mat.dispose());
    }
}
