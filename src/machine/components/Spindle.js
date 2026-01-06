import * as THREE from 'three';

export class Spindle extends THREE.Group {
    constructor() {
        super();

        this.spindleSpeed = 0;

        this.createSpindle();
    }

    createSpindle() {
        // The Spindle Head (Ram)
        // This is the heavy casting that moves up/down (Z-axis)
        const ramWidth = 0.25;
        const ramDepth = 0.3;
        const ramHeight = 0.4;

        const ramGeometry = new THREE.BoxGeometry(ramWidth, ramHeight, ramDepth);
        const ramMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444, // Cast iron grey
            roughness: 0.7,
            metalness: 0.3
        });

        const ram = new THREE.Mesh(ramGeometry, ramMaterial);
        ram.position.y = 0.2; // Centered vertically relative to mount
        this.add(ram);

        // Detailed Spindle Cartridge (The shiny precision part)
        const cartridgeRadius = 0.09;
        const cartridgeHeight = 0.15;
        const cartridgeGeo = new THREE.CylinderGeometry(cartridgeRadius, cartridgeRadius * 0.8, cartridgeHeight, 32);
        const cartridgeMat = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            roughness: 0.2,
            metalness: 0.8
        });
        const cartridge = new THREE.Mesh(cartridgeGeo, cartridgeMat);
        cartridge.position.y = -0.075; // Protruding from bottom of Ram
        this.add(cartridge);

        // Rotating Spindle Nose
        this.spindleNose = new THREE.Group();
        this.spindleNose.position.y = -0.15; // Bottom of cartridge

        const noseGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 32);
        const noseMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5, roughness: 0.5 });
        const nose = new THREE.Mesh(noseGeo, noseMat);
        this.spindleNose.add(nose);

        // Drive Dogs
        const dogGeo = new THREE.BoxGeometry(0.025, 0.03, 0.025);
        const dog1 = new THREE.Mesh(dogGeo, noseMat);
        dog1.position.set(0.055, -0.02, 0);
        this.spindleNose.add(dog1);
        const dog2 = new THREE.Mesh(dogGeo, noseMat);
        dog2.position.set(-0.055, -0.02, 0);
        this.spindleNose.add(dog2);

        this.add(this.spindleNose);

        // Tool Holder (CAT40/BT40 visual)
        this.toolHolder = new THREE.Group();
        this.toolHolder.position.y = -0.025; // Relative to nose

        // V-Flange
        const flangeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.015, 32);
        const chromeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1.0, roughness: 0.1 });
        const flange = new THREE.Mesh(flangeGeo, chromeMat);
        this.toolHolder.add(flange);

        this.spindleNose.add(this.toolHolder);

        // Coolant Nozzles (Flexible orange pipes)
        const nozzleGroup = new THREE.Group();
        const nozzleMat = new THREE.MeshStandardMaterial({ color: 0xff4400, roughness: 0.8 });

        // Left Nozzle
        const nozzleL = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.15), nozzleMat);
        nozzleL.position.set(-0.15, -0.1, 0.15);
        nozzleL.rotation.z = -0.5;
        nozzleL.rotation.x = 0.5;
        nozzleGroup.add(nozzleL);

        // Right Nozzle
        const nozzleR = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.15), nozzleMat);
        nozzleR.position.set(0.15, -0.1, 0.15);
        nozzleR.rotation.z = 0.5;
        nozzleR.rotation.x = 0.5;
        nozzleGroup.add(nozzleR);

        this.add(nozzleGroup);

        // Pneumatic/Hydraulic lines on top
        const cableGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.3);
        const cableMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const cable = new THREE.Mesh(cableGeo, cableMat);
        cable.position.set(0.05, 0.55, -0.1);
        this.add(cable);

        this.setTool('endmill', 10);
    }

    setTool(toolType, diameter) {
        const existingTool = this.toolHolder.getObjectByName('currentTool');
        if (existingTool) {
            this.toolHolder.remove(existingTool);
        }

        const tool = new THREE.Group();
        tool.name = 'currentTool';

        const toolRadius = diameter * 0.001;
        const toolLength = diameter * 0.003;

        switch (toolType) {
            case 'endmill':
                this.createEndMill(tool, toolRadius, toolLength);
                break;
            case 'ballmill':
                this.createBallMill(tool, toolRadius, toolLength);
                break;
            case 'drill':
                this.createDrill(tool, toolRadius, toolLength);
                break;
            default:
                this.createEndMill(tool, toolRadius, toolLength);
        }

        tool.position.y = -0.85;
        this.toolHolder.add(tool);
    }

    createEndMill(parent, radius, length) {
        const cuttingGeometry = new THREE.CylinderGeometry(radius, radius, length, 16);
        const cuttingMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            roughness: 0.3,
            metalness: 0.9
        });
        const cutting = new THREE.Mesh(cuttingGeometry, cuttingMaterial);
        cutting.position.y = -length / 2;
        parent.add(cutting);

        const shankGeometry = new THREE.CylinderGeometry(radius * 0.8, radius * 0.8, length * 1.5, 16);
        const shankMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.4,
            metalness: 0.8
        });
        const shank = new THREE.Mesh(shankGeometry, shankMaterial);
        shank.position.y = length * 0.5;
        parent.add(shank);

        const endGeometry = new THREE.CircleGeometry(radius, 16);
        const endMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.2,
            metalness: 0.95
        });
        const endFace = new THREE.Mesh(endGeometry, endMaterial);
        endFace.rotation.x = Math.PI / 2;
        endFace.position.y = -length;
        parent.add(endFace);
    }

    createBallMill(parent, radius, length) {
        this.createEndMill(parent, radius, length);

        const ballGeometry = new THREE.SphereGeometry(radius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const ballMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            roughness: 0.3,
            metalness: 0.9
        });
        const ball = new THREE.Mesh(ballGeometry, ballMaterial);
        ball.rotation.x = Math.PI;
        ball.position.y = -length;
        parent.add(ball);
    }

    createDrill(parent, radius, length) {
        const drillGeometry = new THREE.CylinderGeometry(0, radius, length, 16);
        const drillMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            roughness: 0.3,
            metalness: 0.9
        });
        const drill = new THREE.Mesh(drillGeometry, drillMaterial);
        drill.position.y = -length / 2;
        parent.add(drill);
    }

    setSpeed(rpm) {
        this.spindleSpeed = rpm;
    }

    update(delta) {
        if (this.spindleSpeed !== 0 && this.spindleNose) {
            const rotationSpeed = (this.spindleSpeed / 60) * (2 * Math.PI);
            this.spindleNose.rotation.y += rotationSpeed * delta;
        }
    }

    getToolTip() {
        const tipPosition = new THREE.Vector3(0, -0.85, 0);
        this.localToWorld(tipPosition);
        return tipPosition;
    }
}
