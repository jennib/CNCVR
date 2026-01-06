import * as THREE from 'three';

export class Workpiece extends THREE.Group {
    constructor(materialType = 'aluminum', shape = 'rectangular', dimensions = { x: 100, y: 100, z: 50 }) {
        super();

        this.materialType = materialType;
        this.shape = shape;
        this.dimensions = dimensions; // in mm
        this.originalGeometry = null;
        this.currentGeometry = null;
        this.materialRemovalEngine = null;

        this.createWorkpiece();
    }

    createWorkpiece() {
        const scaleX = this.dimensions.x * 0.001;
        const scaleY = this.dimensions.y * 0.001;
        const scaleZ = this.dimensions.z * 0.001;

        switch (this.shape) {
            case 'rectangular':
                this.currentGeometry = new THREE.BoxGeometry(scaleX, scaleZ, scaleY);
                break;
            case 'cylindrical':
                this.currentGeometry = new THREE.CylinderGeometry(scaleX / 2, scaleX / 2, scaleZ, 32);
                break;
            case 'round_stock':
                this.currentGeometry = new THREE.CylinderGeometry(scaleX / 2, scaleX / 2, scaleY, 32);
                this.currentGeometry.rotateX(Math.PI / 2);
                break;
            default:
                this.currentGeometry = new THREE.BoxGeometry(scaleX, scaleZ, scaleY);
        }

        this.originalGeometry = this.currentGeometry.clone();

        const material = this.getMaterialForType(this.materialType);

        this.mesh = new THREE.Mesh(this.currentGeometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        this.add(this.mesh);
        this.addCoordinateSystem();
    }

    getMaterialForType(type) {
        const materials = {
            'aluminum': { color: 0xc0c0c0, metalness: 0.9, roughness: 0.3, envMapIntensity: 1.0 },
            'aluminum_6061': { color: 0xb8b8b8, metalness: 0.85, roughness: 0.35, envMapIntensity: 0.9 },
            'aluminum_7075': { color: 0xd0d0d0, metalness: 0.9, roughness: 0.25, envMapIntensity: 1.0 },
            'mild_steel': { color: 0x888888, metalness: 0.95, roughness: 0.4, envMapIntensity: 0.8 },
            'stainless_steel': { color: 0xa0a0a0, metalness: 0.98, roughness: 0.2, envMapIntensity: 1.2 },
            'brass': { color: 0xb5a642, metalness: 0.9, roughness: 0.3, envMapIntensity: 1.0 },
            'plastic': { color: 0x4a90e2, metalness: 0.0, roughness: 0.6, envMapIntensity: 0.5 }
        };

        const props = materials[type] || materials['aluminum'];

        return new THREE.MeshStandardMaterial({
            color: props.color,
            metalness: props.metalness,
            roughness: props.roughness,
            envMapIntensity: props.envMapIntensity
        });
    }

    addCoordinateSystem() {
        const axisLength = 0.05;
        const axisGroup = new THREE.Group();

        const xGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(axisLength, 0, 0)]);
        axisGroup.add(new THREE.Line(xGeom, new THREE.LineBasicMaterial({ color: 0xff0000 })));

        const yGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, axisLength, 0)]);
        axisGroup.add(new THREE.Line(yGeom, new THREE.LineBasicMaterial({ color: 0x00ff00 })));

        const zGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, axisLength)]);
        axisGroup.add(new THREE.Line(zGeom, new THREE.LineBasicMaterial({ color: 0x0000ff })));

        const offset = {
            x: -(this.dimensions.x * 0.001) / 2,
            y: -(this.dimensions.z * 0.001) / 2,
            z: -(this.dimensions.y * 0.001) / 2
        };
        axisGroup.position.set(offset.x, offset.y, offset.z);

        this.add(axisGroup);
    }

    getBoundingBox() {
        return new THREE.Box3().setFromObject(this.mesh);
    }

    getVolumeRemoved() {
        return 0;
    }

    reset() {
        if (this.originalGeometry && this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.geometry = this.originalGeometry.clone();
        }
    }

    setMaterial(materialType) {
        this.materialType = materialType;
        if (this.mesh) {
            this.mesh.material.dispose();
            this.mesh.material = this.getMaterialForType(materialType);
        }
    }

    getInfo() {
        return {
            material: this.materialType,
            shape: this.shape,
            dimensions: this.dimensions,
            volume: this.dimensions.x * this.dimensions.y * this.dimensions.z,
            volumeRemoved: this.getVolumeRemoved()
        };
    }

    async initMaterialRemoval() {
        if (!this.materialRemovalEngine) {
            try {
                const { MaterialRemovalEngine } = await import('./MaterialRemovalEngine.js');
                this.materialRemovalEngine = new MaterialRemovalEngine(this);
                console.log('Material removal engine initialized');
                return true;
            } catch (error) {
                console.warn('Material removal not available:', error.message);
                return false;
            }
        }
        return true;
    }

    async performCut(tool, position) {
        if (!this.materialRemovalEngine) {
            await this.initMaterialRemoval();
        }

        if (this.materialRemovalEngine) {
            return await this.materialRemovalEngine.cutAtPosition(tool, position);
        }
        return false;
    }

    update(delta) {
        // Future: animations or effects
    }
}
