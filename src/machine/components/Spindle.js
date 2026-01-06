import * as THREE from 'three';

export class Spindle extends THREE.Group {
    constructor() {
        super();

        this.spindleSpeed = 0;

        this.createSpindle();
    }

    createSpindle() {
        // 1. Connection Arm (The "Box" connecting Z to Spindle)
        // More Slender: Height 0.2, Width 0.15, Length 0.75.
        const armGeo = new THREE.BoxGeometry(0.2, 0.15, 0.75);
        const armMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.6,
            metalness: 0.4
        });
        const arm = new THREE.Mesh(armGeo, armMat);
        // Center Vertically at -0.05 (Top +0.05).
        // Center Z at 0.375 (Extends 0 to 0.75).
        arm.position.set(-0.05, 0, 0.375);
        this.add(arm);

        // 2. Main Spindle Body (Compact Vertical Column)
        // Shortened to 0.5m. Ends flush with Arm Top.
        const bodyGeo = new THREE.BoxGeometry(0.5, 0.22, 0.22);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.3
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        // Top Aligned with Arm Top (+0.05).
        // Height 0.5. Center = 0.05 - 0.25 = -0.2.
        body.position.set(-0.2, 0, 0.85);
        this.add(body);

        // 3. Motor Fan/Cover (Top)
        const motorGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.15, 32);
        const motorMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const motor = new THREE.Mesh(motorGeo, motorMat);
        motor.rotation.z = -Math.PI / 2;
        motor.position.set(0.125, 0, 0.85); // Flush on top (+0.05 + half-height 0.075)
        this.add(motor);

        // 4. Spindle Cartridge (Bottom Stick-out)
        const housingGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.1, 32);
        const housingMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.6 });
        const housing = new THREE.Mesh(housingGeo, housingMat);
        housing.rotation.z = -Math.PI / 2;
        housing.position.set(-0.5, 0, 0.85); // Below Body (-0.45 - half-height 0.05)
        this.add(housing);

        // 5. Rotating Spindle Nose Group
        this.spindleNose = new THREE.Group();
        this.spindleNose.position.set(-0.575, 0, 0.85); // Below housing
        this.spindleNose.rotation.z = -Math.PI / 2;
        this.add(this.spindleNose);

        // Main Nose Cylinder
        const noseGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 32);
        const noseMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5, roughness: 0.5 });
        const nose = new THREE.Mesh(noseGeo, noseMat);
        this.spindleNose.add(nose);

        // ER Nut 
        const nutGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.03, 6);
        const nutMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const nut = new THREE.Mesh(nutGeo, nutMat);
        nut.position.y = -0.04;
        this.spindleNose.add(nut);

        // ER Collet
        const colletGeo = new THREE.CylinderGeometry(0.025, 0.015, 0.03, 16);
        const colletMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        const collet = new THREE.Mesh(colletGeo, colletMat);
        collet.position.y = -0.07;
        this.spindleNose.add(collet);

        // Tool Holder
        this.toolHolder = new THREE.Group();
        this.toolHolder.position.y = -0.085;
        this.spindleNose.add(this.toolHolder);

        // Default Tool
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
