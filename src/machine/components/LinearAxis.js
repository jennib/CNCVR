import * as THREE from 'three';

export class LinearAxis extends THREE.Group {
    constructor(axisName, travelDistance) {
        super();

        this.axisName = axisName;
        this.travelDistance = travelDistance;
        this.currentPosition = 0;

        this.createAxis();
    }

    createAxis() {
        // Guide rail
        // Convert mm to meters (0.001) for WebXR standard (1 unit = 1 meter)
        this.railLength = (this.travelDistance * 0.001) + 0.2;

        // Way Cover Material (Steel Telescoping / Bellows)
        const coverMat = new THREE.MeshStandardMaterial({
            color: 0x222222, // Darker steel
            roughness: 0.4,
            metalness: 0.6
        });

        // Initialize covers with placeholder geometry
        const coverGeo = new THREE.BoxGeometry(1, 0.1, 0.35); // Slightly wider than carriage

        this.cover1 = new THREE.Mesh(coverGeo, coverMat);
        this.add(this.cover1);

        this.cover2 = new THREE.Mesh(coverGeo, coverMat);
        this.add(this.cover2);

        // Internal Guide Rails
        const railGeometry = new THREE.BoxGeometry(this.railLength, 0.05, 0.05);
        const railMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });

        const rail1 = new THREE.Mesh(railGeometry, railMaterial);
        rail1.position.z = 0.12;
        this.add(rail1);

        const rail2 = new THREE.Mesh(railGeometry, railMaterial);
        rail2.position.z = -0.12;
        this.add(rail2);

        // Ball screw (center)
        const screwGeometry = new THREE.CylinderGeometry(0.01, 0.01, this.railLength, 16);
        const screwMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
        const ballScrew = new THREE.Mesh(screwGeometry, screwMaterial);
        ballScrew.rotation.z = Math.PI / 2;
        this.add(ballScrew);

        // Moving carriage
        this.carriage = new THREE.Group();

        const carriageGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.35);
        this.carriageWidth = 0.3;

        const carriageMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a4a4a,
            roughness: 0.5,
            metalness: 0.5
        });
        const carriageBlock = new THREE.Mesh(carriageGeometry, carriageMaterial);
        carriageBlock.position.y = 0.08;
        this.carriage.add(carriageBlock);

        // Linear bearing blocks on carriage
        const bearingGeometry = new THREE.BoxGeometry(0.1, 0.06, 0.08);
        const bearingMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.4,
            metalness: 0.6
        });

        const bearing1 = new THREE.Mesh(bearingGeometry, bearingMaterial);
        bearing1.position.set(-0.08, 0.0, 0.15); // Align with rails
        this.carriage.add(bearing1);

        const bearing1b = new THREE.Mesh(bearingGeometry, bearingMaterial);
        bearing1b.position.set(0.08, 0.0, 0.15);
        this.carriage.add(bearing1b);

        const bearing2 = new THREE.Mesh(bearingGeometry, bearingMaterial);
        bearing2.position.set(-0.08, 0.0, -0.15);
        this.carriage.add(bearing2);

        const bearing2b = new THREE.Mesh(bearingGeometry, bearingMaterial);
        bearing2b.position.set(0.08, 0.0, -0.15);
        this.carriage.add(bearing2b);

        this.add(this.carriage);

        // Servo motor at end
        const motorGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.2);
        const motorMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.6,
            metalness: 0.4
        });
        const motor = new THREE.Mesh(motorGeometry, motorMaterial);
        motor.position.x = this.railLength / 2 + 0.11;
        this.add(motor);

        // Motor encoder cap
        const encGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16);
        const encoder = new THREE.Mesh(encGeo, new THREE.MeshStandardMaterial({ color: 0x111111 }));
        encoder.rotation.z = Math.PI / 2;
        encoder.position.x = this.railLength / 2 + 0.23;
        this.add(encoder);

        // Axis label
        this.createLabel();
    }

    createLabel() {
        // ... (Keep existing simple texture logic but scale down)
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        // Clear bg
        // ctx.clearRect(0,0,64,64); 
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.axisName, 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const labelGeometry = new THREE.PlaneGeometry(0.1, 0.1);
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.set(0, 0.15, 0);
        this.carriage.add(label);
    }

    setPosition(position) {
        // Position is in mm, convert to meters (0.001)
        const maxTravel = (this.travelDistance * 0.001) / 2;

        const posMeters = position * 0.001;
        const clampedPos = THREE.MathUtils.clamp(posMeters, -maxTravel, maxTravel);

        this.carriage.position.x = clampedPos;
        this.currentPosition = clampedPos;

        // Update Way Covers (dynamic resizing)
        if (this.cover1 && this.cover2 && this.railLength && this.carriageWidth) {
            const railHalf = this.railLength / 2;
            const carriageHalf = this.carriageWidth / 2;

            // Left Cover (cover1)
            // Spans from -railHalf to clampedPos - carriageHalf
            const c1Start = -railHalf;
            const c1End = clampedPos - carriageHalf;
            const c1Len = Math.max(0.001, c1End - c1Start);
            this.cover1.scale.x = c1Len;
            this.cover1.position.x = c1Start + c1Len / 2;

            // Right Cover (cover2)
            // Spans from clampedPos + carriageHalf to railHalf
            const c2Start = clampedPos + carriageHalf;
            const c2End = railHalf;
            const c2Len = Math.max(0.001, c2End - c2Start);
            this.cover2.scale.x = c2Len;
            this.cover2.position.x = c2Start + c2Len / 2;
        }
    }

    getPosition() {
        return this.currentPosition;
    }
}
