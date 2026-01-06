import * as THREE from 'three';

export class ControlPanel extends THREE.Group {
    constructor(scene, cncMachine) {
        super();

        this.cncMachine = cncMachine;
        this.buttons = [];
        this.displays = {};

        this.createPanel();
    }

    createPanel() {
        // Main panel housing
        const panelGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.15);
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.5,
            metalness: 0.6
        });
        const panelHousing = new THREE.Mesh(panelGeometry, panelMaterial);
        panelHousing.position.set(0, 1.2, 0);
        this.add(panelHousing);

        // Angled top for ergonomics
        const angleFace = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.4, 0.05),
            panelMaterial
        );
        angleFace.rotation.x = -Math.PI / 6;
        angleFace.position.set(0, 1.75, -0.05);
        this.add(angleFace);

        // LCD Display for DRO (Digital Readout)
        this.createDisplay();

        // Control buttons
        this.createButtons();

        // Jog wheel
        this.createJogWheel();

        // Emergency stop
        this.createEStop();

        // Pendant support column
        const columnGeometry = new THREE.CylinderGeometry(0.05, 0.08, 1.2, 16);
        const columnMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            roughness: 0.6,
            metalness: 0.5
        });
        const column = new THREE.Mesh(columnGeometry, columnMaterial);
        column.position.y = 0.6;
        this.add(column);
    }

    createDisplay() {
        // Create canvas for DRO display
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Initial render
        this.renderDisplay(ctx);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        this.displayCanvas = canvas;
        this.displayContext = ctx;
        this.displayTexture = texture;

        const displayGeometry = new THREE.PlaneGeometry(0.6, 0.45);
        const displayMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            emissive: 0x001100,
            emissiveIntensity: 0.5
        });

        const display = new THREE.Mesh(displayGeometry, displayMaterial);
        display.position.set(0, 1.4, 0.08);
        this.add(display);

        // Display bezel
        const bezelGeometry = new THREE.BoxGeometry(0.65, 0.5, 0.02);
        const bezelMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.7
        });
        const bezel = new THREE.Mesh(bezelGeometry, bezelMaterial);
        bezel.position.set(0, 1.4, 0.06);
        this.add(bezel);
    }

    renderDisplay(ctx) {
        // Clear
        ctx.fillStyle = '#001a00';
        ctx.fillRect(0, 0, 512, 512);

        // Get current positions from machine
        const pos = this.cncMachine ? this.cncMachine.getCurrentPosition() : {
            x: 0, y: 0, z: 0, a: 0, b: 0
        };

        const spindle = this.cncMachine ? this.cncMachine.state.spindleRPM : 0;
        const feedrate = this.cncMachine ? this.cncMachine.state.feedrate : 0;

        // Draw text
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 32px monospace';
        ctx.fillText('CNC SIMULATOR', 20, 40);

        ctx.font = 'bold 48px monospace';
        ctx.fillText(`X: ${pos.x.toFixed(3)}`, 20, 120);
        ctx.fillText(`Y: ${pos.y.toFixed(3)}`, 20, 180);
        ctx.fillText(`Z: ${pos.z.toFixed(3)}`, 20, 240);
        ctx.fillText(`A: ${pos.a.toFixed(2)}°`, 20, 300);
        ctx.fillText(`B: ${pos.b.toFixed(2)}°`, 20, 360);

        ctx.font = 'bold 32px monospace';
        ctx.fillText(`S: ${spindle} RPM`, 20, 420);
        ctx.fillText(`F: ${feedrate} mm/min`, 20, 470);
    }

    createButtons() {
        const buttonPositions = [
            { label: 'START', color: 0x00ff00, pos: [-0.25, 1.0, 0.08] },
            { label: 'STOP', color: 0xff0000, pos: [0.25, 1.0, 0.08] },
            { label: 'PAUSE', color: 0xffff00, pos: [0, 0.85, 0.08] },
            { label: 'RESET', color: 0x0088ff, pos: [0, 0.7, 0.08] }
        ];

        buttonPositions.forEach(btn => {
            const button = this.createButton(btn.label, btn.color);
            button.position.set(...btn.pos);
            button.userData = { label: btn.label, type: 'button' };
            this.add(button);
            this.buttons.push(button);
        });

        // Jog direction buttons (directional pad)
        const jogButtons = [
            { label: 'X+', axis: 'x', dir: 1, pos: [0.15, 1.65, 0.03] },
            { label: 'X-', axis: 'x', dir: -1, pos: [-0.15, 1.65, 0.03] },
            { label: 'Y+', axis: 'y', dir: 1, pos: [0, 1.8, 0.03] },
            { label: 'Y-', axis: 'y', dir: -1, pos: [0, 1.5, 0.03] },
            { label: 'Z+', axis: 'z', dir: 1, pos: [0.3, 1.65, 0.03] },
            { label: 'Z-', axis: 'z', dir: -1, pos: [-0.3, 1.65, 0.03] }
        ];

        jogButtons.forEach(btn => {
            const button = this.createJogButton(btn.label);
            button.position.set(...btn.pos);
            button.userData = {
                label: btn.label,
                type: 'jog',
                axis: btn.axis,
                direction: btn.dir
            };
            this.add(button);
            this.buttons.push(button);
        });
    }

    createButton(label, color) {
        const group = new THREE.Group();

        // Button body
        const buttonGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
        const buttonMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.4,
            metalness: 0.6,
            emissive: color,
            emissiveIntensity: 0.2
        });
        const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
        button.rotation.x = Math.PI / 2;
        group.add(button);

        // Label
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, 64, 40);

        const labelTexture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.MeshBasicMaterial({
            map: labelTexture,
            transparent: true
        });
        const labelPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(0.12, 0.06),
            labelMaterial
        );
        labelPlane.position.y = -0.04;
        group.add(labelPlane);

        return group;
    }

    createJogButton(label) {
        const button = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.08, 0.02),
            new THREE.MeshStandardMaterial({
                color: 0x4a4a4a,
                roughness: 0.5,
                metalness: 0.5
            })
        );

        // Arrow or label
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        button.material.map = texture;
        button.material.needsUpdate = true;

        return button;
    }

    createJogWheel() {
        const wheelGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.03, 32);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.3,
            metalness: 0.7
        });
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(0.25, 1.65, 0.03);
        wheel.userData = { type: 'jogwheel' };
        this.add(wheel);
        this.jogWheel = wheel;
    }

    createEStop() {
        const eStopGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16);
        const eStopMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            roughness: 0.5,
            metalness: 0.5,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        const eStop = new THREE.Mesh(eStopGeometry, eStopMaterial);
        eStop.rotation.x = Math.PI / 2;
        eStop.position.set(0, 0.5, 0.08);
        eStop.userData = { type: 'estop', label: 'E-STOP' };
        this.add(eStop);
        this.buttons.push(eStop);

        // E-STOP label
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('EMERGENCY', 64, 20);

        const labelTexture = new THREE.CanvasTexture(canvas);
        const label = new THREE.Mesh(
            new THREE.PlaneGeometry(0.2, 0.05),
            new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true })
        );
        label.position.set(0, 0.4, 0.08);
        this.add(label);
    }

    handleButtonPress(button) {
        if (!button.userData || !this.cncMachine) return;

        const { type, label, axis, direction } = button.userData;

        switch (type) {
            case 'button':
                this.handleControlButton(label);
                break;
            case 'jog':
                this.handleJog(axis, direction);
                break;
            case 'estop':
                this.cncMachine.emergencyStop();
                break;
        }

        // Visual feedback
        if (button.material) {
            const originalEmissive = button.material.emissiveIntensity;
            button.material.emissiveIntensity = 1.0;
            setTimeout(() => {
                button.material.emissiveIntensity = originalEmissive;
            }, 100);
        }
    }

    handleControlButton(label) {
        switch (label) {
            case 'START':
                console.log('Starting program...');
                // TODO: Start G-code program
                break;
            case 'STOP':
                console.log('Stopping...');
                this.cncMachine.stopSpindle();
                break;
            case 'PAUSE':
                console.log('Pausing...');
                // TODO: Pause G-code execution
                break;
            case 'RESET':
                console.log('Resetting...');
                // TODO: Reset machine state
                break;
        }
    }

    handleJog(axis, direction) {
        if (!this.cncMachine) return;

        const jogIncrement = 1; // 1mm
        const currentPos = this.cncMachine.axisPositions[axis];
        const newPos = currentPos + (jogIncrement * direction);

        this.cncMachine.moveAxis(axis, newPos, false);
        console.log(`Jogging ${axis.toUpperCase()} to ${newPos.toFixed(3)}`);
    }

    update(delta) {
        // Update display
        if (this.displayContext && this.displayTexture) {
            this.renderDisplay(this.displayContext);
            this.displayTexture.needsUpdate = true;
        }
    }

    getInteractableObjects() {
        return this.buttons;
    }
}
