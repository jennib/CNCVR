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

        // 2. The Column (C-Frame Back)
        // Massive vertical tower rising from the back of the bed
        const colWidth = 1.0;
        const colHeight = 2.5;
        const colDepth = 0.8;

        const columnGeo = new THREE.BoxGeometry(colWidth, colHeight, colDepth);
        const column = new THREE.Mesh(columnGeo, castIronMaterial);

        // Position: Centered X, Behind the main workspace
        // If bed is centered at 0, its back is at -1.1. 
        // We want the column to overlap slightly or be flush.
        column.position.set(0, colHeight / 2, -0.8);
        this.add(column);

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

        // Electrical cabinet removed

        // Name Plate removed by implication or strictly?
        // User said "get rid of ... large white box to the right". 
        // That matches the cabinet.
        // Also "cuge floating above the turntable".
        // "Cuge" likely means "Cube".
        // That matches the Workpiece.

        // 6. Name Plate / Logo
        const plateGeo = new THREE.BoxGeometry(0.6, 0.2, 0.02);
        const plateMat = new THREE.MeshStandardMaterial({ color: 0xcc0000 });
        const plate = new THREE.Mesh(plateGeo, plateMat);
        plate.position.set(0, 1.8, -0.8 + colDepth / 2 + 0.01); // Front of column
        this.add(plate);
    }
}
