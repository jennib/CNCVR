import * as THREE from 'three';

export class CoolantSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.maxParticles = 200;
        this.particleGeometry = null;
        this.particleMaterial = null;
        this.isActive = false;
        this.nozzlePosition = new THREE.Vector3(0, 2, 0);
        this.targetPosition = new THREE.Vector3(0, 1, 0);

        this.createParticleSystem();
    }

    createParticleSystem() {
        // Particle geometry - small sphere
        this.particleGeometry = new THREE.SphereGeometry(0.003, 4, 4);

        // Coolant material - translucent blue-white
        this.particleMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.6,
            metalness: 0.1,
            roughness: 0.2,
            emissive: 0x4488cc,
            emissiveIntensity: 0.3
        });
    }

    setNozzlePosition(position) {
        this.nozzlePosition.copy(position);
    }

    setTargetPosition(position) {
        this.targetPosition.copy(position);
    }

    activate() {
        this.isActive = true;
    }

    deactivate() {
        this.isActive = false;
        // Gradually clear particles
    }

    update(delta) {
        if (!this.isActive) {
            // Fade out existing particles
            this.particles.forEach((particle, index) => {
                particle.life -= delta * 2;
                if (particle.life <= 0) {
                    this.scene.remove(particle.mesh);
                    particle.mesh.geometry.dispose();
                    this.particles.splice(index, 1);
                }
            });
            return;
        }

        // Generate new particles
        const particlesPerFrame = 3;
        for (let i = 0; i < particlesPerFrame; i++) {
            if (this.particles.length < this.maxParticles) {
                this.createParticle();
            }
        }

        // Update existing particles
        const gravity = new THREE.Vector3(0, -2.0, 0);

        this.particles.forEach((particle, index) => {
            // Apply physics
            particle.velocity.add(gravity.clone().multiplyScalar(delta));
            particle.mesh.position.add(particle.velocity.clone().multiplyScalar(delta));

            // Age particle
            particle.life -= delta;

            // Fade opacity
            const opacity = Math.min(1.0, particle.life / 0.5);
            particle.mesh.material.opacity = opacity * 0.6;

            // Remove old particles
            if (particle.life <= 0 || particle.mesh.position.y < 0) {
                this.scene.remove(particle.mesh);
                particle.mesh.geometry.dispose();
                this.particles.splice(index, 1);
            }
        });
    }

    createParticle() {
        const direction = new THREE.Vector3()
            .subVectors(this.targetPosition, this.nozzlePosition)
            .normalize();

        // Add some spread
        direction.x += (Math.random() - 0.5) * 0.2;
        direction.y += (Math.random() - 0.5) * 0.1;
        direction.z += (Math.random() - 0.5) * 0.2;
        direction.normalize();

        const speed = 1.0 + Math.random() * 0.5;

        const particle = {
            mesh: new THREE.Mesh(this.particleGeometry, this.particleMaterial),
            velocity: direction.multiplyScalar(speed),
            life: 1.0 + Math.random() * 0.5
        };

        particle.mesh.position.copy(this.nozzlePosition);
        particle.mesh.position.x += (Math.random() - 0.5) * 0.02;
        particle.mesh.position.z += (Math.random() - 0.5) * 0.02;

        this.particles.push(particle);
        this.scene.add(particle.mesh);
    }

    clear() {
        this.particles.forEach(particle => {
            this.scene.remove(particle.mesh);
            particle.mesh.geometry.dispose();
        });
        this.particles = [];
    }

    dispose() {
        this.clear();
        if (this.particleGeometry) {
            this.particleGeometry.dispose();
        }
        if (this.particleMaterial) {
            this.particleMaterial.dispose();
        }
    }
}
