import * as THREE from 'three';

export class TrunnionTable extends THREE.Group {
    constructor(aRange, bRange) {
        super();

        this.aRange = aRange; // [-110, 110] degrees
        this.bRange = bRange; // [0, 360] degrees
        this.currentA = 0;
        this.currentB = 0;

        this.createTrunnion();
    }

    createTrunnion() {
        // Materials
        const castIronMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7, metalness: 0.3 });
        const machinedSteelMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.3, metalness: 0.7 });
        const tableMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.5, metalness: 0.5 });
        const housingMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.4, metalness: 0.1 });

        // 1. Fixed Supports (The "shoulders" of the trunnion)
        const supportGeo = new THREE.BoxGeometry(0.3, 0.8, 0.6);

        const leftSupport = new THREE.Mesh(supportGeo, castIronMat);
        leftSupport.position.set(-0.9, 0.4, 0);
        this.add(leftSupport);

        const rightSupport = new THREE.Mesh(supportGeo, castIronMat);
        rightSupport.position.set(0.9, 0.4, 0);
        this.add(rightSupport);

        // Bearing housings
        const bearingGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 32);
        const leftBearing = new THREE.Mesh(bearingGeo, housingMat);
        leftBearing.rotation.z = Math.PI / 2;
        leftBearing.position.set(-0.7, 0.6, 0);
        this.add(leftBearing);

        const rightBearing = new THREE.Mesh(bearingGeo, housingMat);
        rightBearing.rotation.z = Math.PI / 2;
        rightBearing.position.set(0.7, 0.6, 0);
        this.add(rightBearing);


        // 2. A-Axis Cradle (The tilting U-shape)
        // Hierarchy: This group rotates around X-axis
        this.cradleGroup = new THREE.Group();
        this.cradleGroup.position.set(0, 0.6, 0); // Pivot point align with bearings
        this.add(this.cradleGroup);

        // Cradle Body (U-shape constructed from boxes)
        const cradleBottomGeo = new THREE.BoxGeometry(1.4, 0.2, 0.6);
        const cradleBottom = new THREE.Mesh(cradleBottomGeo, castIronMat);
        cradleBottom.position.set(0, -0.3, 0); // Hangs below pivot
        this.cradleGroup.add(cradleBottom);

        const cradleSideGeo = new THREE.BoxGeometry(0.1, 0.5, 0.6);
        const cradleLeft = new THREE.Mesh(cradleSideGeo, castIronMat);
        cradleLeft.position.set(-0.65, -0.15, 0);
        this.cradleGroup.add(cradleLeft);

        const cradleRight = new THREE.Mesh(cradleSideGeo, castIronMat);
        cradleRight.position.set(0.65, -0.15, 0);
        this.cradleGroup.add(cradleRight);

        // Motor housing for B-axis (under the cradle)
        const bMotorGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 32);
        const bMotor = new THREE.Mesh(bMotorGeo, castIronMat);
        bMotor.position.set(0, -0.5, 0);
        this.cradleGroup.add(bMotor);


        // 3. B-Axis Platter (The rotary table)
        // Hierarchy: Child of Cradle, Rotates around Y
        this.platformGroup = new THREE.Group();
        this.platformGroup.position.set(0, -0.2, 0); // Sits on cradle bottom
        this.cradleGroup.add(this.platformGroup);

        // Create Segmented Platter (for physical T-slots)
        const platterRadius = 0.5;
        const platterHeight = 0.08;
        const numSlots = 6;
        const slotGapAngle = 5 * (Math.PI / 180); // 5 degrees gap
        const segmentAngle = (2 * Math.PI / numSlots) - slotGapAngle;

        // "Ground Steel" material for the table top
        const platterMat = new THREE.MeshStandardMaterial({
            color: 0x999999,
            roughness: 0.2,
            metalness: 0.6,
            flatShading: false
        });

        // Dark material for the T-slot inner channel
        const slotMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.9,
            metalness: 0.1
        });

        // Base disk (black background for slots)
        const subPlatter = new THREE.Mesh(
            new THREE.CylinderGeometry(platterRadius * 0.98, platterRadius * 0.98, platterHeight * 0.9, 64),
            slotMat
        );
        subPlatter.position.y = platterHeight / 2;
        this.platformGroup.add(subPlatter);

        // Segments
        for (let i = 0; i < numSlots; i++) {
            const startAngle = i * (2 * Math.PI / numSlots) + (slotGapAngle / 2);

            const segmentGeo = new THREE.CylinderGeometry(
                platterRadius, platterRadius,
                platterHeight,
                32, 1,
                false,
                0, segmentAngle // Create generic wedge
            );

            const segment = new THREE.Mesh(segmentGeo, platterMat);

            // Rotate segment to its position
            segment.position.y = platterHeight / 2;
            segment.rotation.y = startAngle;

            // We need to shift the geometry center or group it to rotate correctly?
            // CylinderGeometry is centered on Y axis, but wedge starts at 0 angle.
            // So rotation.y = startAngle places the start of the wedge at startAngle. Correct.

            this.platformGroup.add(segment);

            // Add T-Slot Detail (bottom widening)?
            // Visual only: The gap reveals the black subPlatter.
        }

        // Center Bore Ring
        const boreRadius = 0.08;
        const boreGeo = new THREE.CylinderGeometry(boreRadius, boreRadius, platterHeight + 0.01, 32);
        const bore = new THREE.Mesh(boreGeo, slotMat); // Dark bore
        bore.position.y = platterHeight / 2;
        this.platformGroup.add(bore);

        // Shiny Rim/Ring around bore
        const rimGeo = new THREE.RingGeometry(boreRadius + 0.005, boreRadius + 0.04, 32);
        const rim = new THREE.Mesh(rimGeo, platterMat);
        rim.rotation.x = -Math.PI / 2;
        rim.position.y = platterHeight + 0.005;
        this.platformGroup.add(rim);
    }

    createTSlots(radius, height) {
        // Deprecated: slots are now physical gaps in the platter segments
    }

    setAAngle(degrees) {
        const clamped = THREE.MathUtils.clamp(degrees, this.aRange[0], this.aRange[1]);
        this.currentA = clamped;

        if (this.cradleGroup) {
            // A-axis tilts the cradle around X
            this.cradleGroup.rotation.x = THREE.MathUtils.degToRad(clamped);
        }
    }

    setBAngle(degrees) {
        this.currentB = degrees % 360;

        if (this.platformGroup) {
            // B-axis rotates the platter around Y (local to cradle)
            this.platformGroup.rotation.y = THREE.MathUtils.degToRad(this.currentB);
        }
    }

    getWorkTablePosition() {
        // Returns world position of work table
        const worldPos = new THREE.Vector3();
        if (this.platformGroup) {
            this.platformGroup.getWorldPosition(worldPos);
        }
        return worldPos;
    }
}
