import * as THREE from 'three';

export class MachineBase extends THREE.Group {
    constructor() {
        super();
        this.createBase();
    }

    createBase() {
        // Materials
        const castIronMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a, // Dark geometric grey
            roughness: 0.8,
            metalness: 0.3
        });

        const steelMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.5,
            metalness: 0.5
        });

        const sheetMetalMaterial = new THREE.MeshStandardMaterial({
            color: 0xe0e0e0, // Industrial white/light grey
            roughness: 0.4,
            metalness: 0.2
        });

        // 1. The Bed (Foundation)
        // Solid heavy casting that sits on the floor
        const bedWidth = 2.0;
        const bedHeight = 0.6; // Higher bed
        const bedDepth = 2.2;

        const bedGeo = new THREE.BoxGeometry(bedWidth, bedHeight, bedDepth);
        const bed = new THREE.Mesh(bedGeo, castIronMaterial);
        bed.position.y = bedHeight / 2;
        this.add(bed);

        // Column and Name Plate removed

        // 3. Chip Tray / Pan
        // Wide basin to catch metal chips
        const trayWidth = 2.8;
        const trayDepth = 2.6;
        const trayHeight = 0.2;
        const trayGeo = new THREE.BoxGeometry(trayWidth, trayHeight, trayDepth);
        const tray = new THREE.Mesh(trayGeo, steelMaterial);
        tray.position.y = 0.1;
        this.add(tray);

        // 4. Leveling Feet
        const footGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.15);
        const footPos = [
            [-1.3, -1.2], [1.3, -1.2],
            [-1.3, 1.2], [1.3, 1.2]
        ];
        footPos.forEach(pos => {
            const foot = new THREE.Mesh(footGeo, steelMaterial);
            // x, y, z
            foot.position.set(pos[0], 0.075, pos[1]);
            this.add(foot);
        });
    }
}
