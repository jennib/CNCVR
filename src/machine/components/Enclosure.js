import * as THREE from 'three';

export class Enclosure extends THREE.Group {
    constructor() {
        super();

        this.doorOpen = false;
        this.createEnclosure();
    }

    createEnclosure() {
        // Frame material
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333, // Dark grey powder coat
            roughness: 0.6,
            metalness: 0.4
        });

        // Window Material (Polycarbonate)
        const windowMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.15,
            roughness: 0.1,
            metalness: 0.0,
            transmission: 0.98,
            ior: 1.5,
            side: THREE.FrontSide // BoxGeometry is a volume, FrontSide is correct
        });

        // 1. Structural Frame Posts (Corners)
        const postGeo = new THREE.BoxGeometry(0.12, 2.6, 0.12);
        const postPositions = [
            [-1.5, 1.3, 1.3], [1.5, 1.3, 1.3],
            [-1.5, 1.3, -1.3], [1.5, 1.3, -1.3]
        ];

        postPositions.forEach(pos => {
            const post = new THREE.Mesh(postGeo, frameMaterial);
            post.position.set(...pos);
            this.add(post);
        });

        // 2. Front Door System
        this.door = new THREE.Group();
        this.door.position.set(0, 1.3, 1.3);

        // Door Frame
        const doorFrameGroup = new THREE.Group();

        // Vertical stiles (sides of door)
        const stileWidth = 0.12;
        const stileGeo = new THREE.BoxGeometry(stileWidth, 2.4, 0.05);
        const leftStile = new THREE.Mesh(stileGeo, frameMaterial);
        // Position relative to door center
        leftStile.position.set(-1.45 + stileWidth / 2, 0, 0);

        const rightStile = new THREE.Mesh(stileGeo, frameMaterial);
        rightStile.position.set(1.45 - stileWidth / 2, 0, 0);

        // Top and Bottom rails
        const railHeight = 0.15;
        const railLength = 2.9;
        const railGeo = new THREE.BoxGeometry(railLength, railHeight, 0.05);

        const topRail = new THREE.Mesh(railGeo, frameMaterial);
        topRail.position.set(0, 1.2 - railHeight / 2, 0);

        const bottomRail = new THREE.Mesh(railGeo, frameMaterial);
        bottomRail.position.set(0, -1.2 + railHeight / 2, 0);

        doorFrameGroup.add(leftStile, rightStile, topRail, bottomRail);

        // Door Glass
        const doorGlass = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 0.02), windowMaterial);
        doorGlass.position.z = 0;
        doorFrameGroup.add(doorGlass);

        // Door Handle
        const handleBaseGeo = new THREE.BoxGeometry(0.04, 0.4, 0.04);
        const handleBase = new THREE.Mesh(handleBaseGeo, new THREE.MeshStandardMaterial({ color: 0x111111 }));
        handleBase.position.set(1.2, 0, 0.05);
        doorFrameGroup.add(handleBase);

        const handleBarGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 16);
        const handleBar = new THREE.Mesh(handleBarGeo, new THREE.MeshStandardMaterial({ color: 0xdddddd }));
        handleBar.position.set(1.2, 0, 0.1);
        doorFrameGroup.add(handleBar);

        this.door.add(doorFrameGroup);
        this.add(this.door);


        // 3. Fixed Panels (Sides and Back)
        const sidePanelWidth = 2.6;
        const panelHeight = 2.4;

        // Back Panel
        const backPanelFrameGeo = new THREE.BoxGeometry(3.0, panelHeight, 0.05);
        // We'll just use glass for the main part for now, maybe add a frame later if needed
        // but for specific visuals:
        const backGlass = new THREE.Mesh(new THREE.BoxGeometry(2.9, panelHeight, 0.02), windowMaterial);
        backGlass.position.set(0, 1.3, -1.3);
        this.add(backGlass);

        // Left Panel
        const sideGlassGeo = new THREE.BoxGeometry(0.02, panelHeight, 2.5);
        const leftGlass = new THREE.Mesh(sideGlassGeo, windowMaterial);
        leftGlass.position.set(-1.5, 1.3, 0);
        this.add(leftGlass);

        // Right Panel
        const rightGlass = new THREE.Mesh(sideGlassGeo, windowMaterial);
        rightGlass.position.set(1.5, 1.3, 0);
        this.add(rightGlass);


        // 4. Roof / Top Shield
        const roofGeo = new THREE.BoxGeometry(3.1, 0.1, 2.7);
        const roof = new THREE.Mesh(roofGeo, frameMaterial);
        roof.position.y = 2.65;
        this.add(roof);

        // 5. Lower Chip Guard / Skirt (Stainless Look)
        const skirtGeo = new THREE.BoxGeometry(3.1, 0.6, 2.7);
        const skirtMat = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.5,
            metalness: 0.6
        });
        const skirt = new THREE.Mesh(skirtGeo, skirtMat);
        skirt.position.y = 0.3; // Covers the base area
        this.add(skirt);

        this.createSafetyLights();
    }

    createSafetyLights() {
        // Stack light (red/yellow/green)
        const lightColors = [0xff0000, 0xffff00, 0x00ff00];
        const lightGroup = new THREE.Group();

        lightColors.forEach((color, index) => {
            const lightGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 16);
            const lightMaterial = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.3,
                roughness: 0.3,
                metalness: 0.7
            });
            const light = new THREE.Mesh(lightGeometry, lightMaterial);
            light.position.y = 2.6 - index * 0.1;
            light.name = ['redLight', 'yellowLight', 'greenLight'][index];
            lightGroup.add(light);
        });

        lightGroup.position.set(1.6, 0, 1.2);
        this.add(lightGroup);
    }

    openDoor() {
        if (!this.doorOpen && this.door) {
            // Rotate door open
            this.door.rotation.y = Math.PI / 2;
            this.door.position.x = -1.5;
            this.doorOpen = true;
        }
    }

    closeDoor() {
        if (this.doorOpen && this.door) {
            this.door.rotation.y = 0;
            this.door.position.x = 0;
            this.doorOpen = false;
        }
    }

    setStatusLight(status) {
        // status: 'idle', 'running', 'error'
        const redLight = this.getObjectByName('redLight');
        const yellowLight = this.getObjectByName('yellowLight');
        const greenLight = this.getObjectByName('greenLight');

        if (redLight && yellowLight && greenLight) {
            redLight.material.emissiveIntensity = 0.3;
            yellowLight.material.emissiveIntensity = 0.3;
            greenLight.material.emissiveIntensity = 0.3;

            switch (status) {
                case 'idle':
                    greenLight.material.emissiveIntensity = 1.0;
                    break;
                case 'running':
                    yellowLight.material.emissiveIntensity = 1.0;
                    break;
                case 'error':
                    redLight.material.emissiveIntensity = 1.0;
                    break;
            }
        }
    }
}
