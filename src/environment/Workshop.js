import * as THREE from 'three';

export class Workshop {
    constructor(scene) {
        this.scene = scene;
        this.createEnvironment();
    }

    createEnvironment() {
        // Floor - industrial epoxy coating
        const floorGeometry = new THREE.PlaneGeometry(12, 12);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            roughness: 0.3,
            metalness: 0.1,
            envMapIntensity: 0.5
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Add subtle grid pattern to floor
        const gridHelper = new THREE.GridHelper(12, 24, 0x444444, 0x2a2a2a);
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);

        // Walls - industrial panels
        this.createWalls();

        // Ceiling
        const ceilingGeometry = new THREE.PlaneGeometry(12, 12);
        const ceilingMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a4a4a,
            roughness: 0.9,
            metalness: 0.0
        });
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 5; // Lower ceiling
        ceiling.receiveShadow = true;
        this.scene.add(ceiling);

        // Add some workshop details
        this.addWorkbench();
        this.addToolCabinet();
    }

    createWalls() {
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x5a5a5a,
            roughness: 0.8,
            metalness: 0.1
        });

        // Back wall
        const backWall = new THREE.Mesh(
            new THREE.PlaneGeometry(12, 5),
            wallMaterial
        );
        backWall.position.set(0, 2.5, -6);
        backWall.receiveShadow = true;
        this.scene.add(backWall);

        // Left wall
        const leftWall = new THREE.Mesh(
            new THREE.PlaneGeometry(12, 5),
            wallMaterial
        );
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-6, 2.5, 0);
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);

        // Right wall
        const rightWall = new THREE.Mesh(
            new THREE.PlaneGeometry(12, 5),
            wallMaterial
        );
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(6, 2.5, 0);
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);
    }

    addWorkbench() {
        // ... (Keep existing workbench logic but position closer)
        const benchGroup = new THREE.Group();

        // Bench top
        const topGeometry = new THREE.BoxGeometry(3, 0.1, 0.8);
        const topMaterial = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.7 });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 0.9;
        top.castShadow = true;
        top.receiveShadow = true;
        benchGroup.add(top);

        // Legs
        const legGeometry = new THREE.BoxGeometry(0.08, 0.9, 0.08);
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.4 });
        const legPositions = [[-1.4, 0.45, 0.35], [1.4, 0.45, 0.35], [-1.4, 0.45, -0.35], [1.4, 0.45, -0.35]];

        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(...pos);
            leg.castShadow = true;
            benchGroup.add(leg);
        });

        benchGroup.position.set(-4, 0, -4);
        this.scene.add(benchGroup);
    }

    addToolCabinet() {
        const cabinetGroup = new THREE.Group();
        // ... (Keep existing tool cabinet logic but position closer)

        // Cabinet body
        const bodyGeometry = new THREE.BoxGeometry(1.5, 2, 0.6);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.4, metalness: 0.6 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1;
        body.castShadow = true;
        body.receiveShadow = true;
        cabinetGroup.add(body);

        // Drawer fronts
        const drawerMaterial = new THREE.MeshStandardMaterial({ color: 0xaa0000, roughness: 0.5, metalness: 0.5 });
        for (let i = 0; i < 5; i++) {
            const drawer = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 0.02), drawerMaterial);
            drawer.position.set(0, 0.2 + i * 0.4, 0.31);
            cabinetGroup.add(drawer);
            const handle = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.05), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9 }));
            handle.position.set(0, 0.2 + i * 0.4, 0.35);
            cabinetGroup.add(handle);
        }

        cabinetGroup.position.set(4, 0, -4);
        this.scene.add(cabinetGroup);
    }
}
