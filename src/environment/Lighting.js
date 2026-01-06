import * as THREE from 'three';

export class LightingSystem {
    constructor(scene) {
        this.scene = scene;
        this.createLights();
    }

    createLights() {
        // Ambient light for base illumination
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        // Main overhead directional light (simulating shop lights)
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
        mainLight.position.set(5, 10, 5);
        mainLight.castShadow = true;

        // Configure shadow map for quality
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.camera.left = -10;
        mainLight.shadow.camera.right = 10;
        mainLight.shadow.camera.top = 10;
        mainLight.shadow.camera.bottom = -10;
        mainLight.shadow.bias = -0.0001;

        this.scene.add(mainLight);

        // Fill light from opposite side
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
        fillLight.position.set(-5, 8, -5);
        this.scene.add(fillLight);

        // Spotlight over CNC machine work area
        const workLight = new THREE.SpotLight(0xffffff, 2.0);
        workLight.position.set(0, 5, 0);
        workLight.angle = Math.PI / 6;
        workLight.penumbra = 0.3;
        workLight.decay = 2;
        workLight.distance = 20;
        workLight.castShadow = true;
        workLight.shadow.mapSize.width = 1024;
        workLight.shadow.mapSize.height = 1024;
        this.scene.add(workLight);

        // Point lights for machine interior (inside enclosure)
        // Strong "LED Strip" style lighting
        const machineLightIntensity = 2.5;
        const machineLightDist = 10;
        const machineLightColor = 0xeef4ff; // Cool white

        const machineLight1 = new THREE.PointLight(machineLightColor, machineLightIntensity, machineLightDist);
        machineLight1.position.set(0.8, 2.2, 0.8);
        this.scene.add(machineLight1);

        const machineLight2 = new THREE.PointLight(machineLightColor, machineLightIntensity, machineLightDist);
        machineLight2.position.set(-0.8, 2.2, 0.8);
        this.scene.add(machineLight2);

        // Central flood light
        const machineLight3 = new THREE.PointLight(machineLightColor, machineLightIntensity, machineLightDist);
        machineLight3.position.set(0, 2.2, -0.5); // Slightly back to illuminate front of workpiece
        this.scene.add(machineLight3);
        const hemiLight = new THREE.HemisphereLight(0x8896c4, 0x444444, 0.3);
        this.scene.add(hemiLight);
    }
}
