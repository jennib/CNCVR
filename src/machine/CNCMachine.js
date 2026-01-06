import * as THREE from 'three';
import { MachineBase } from './components/MachineBase.js';
import { LinearAxis } from './components/LinearAxis.js';
import { TrunnionTable } from './components/TrunnionTable.js';
import { Spindle } from './components/Spindle.js';
import { Enclosure } from './components/Enclosure.js';

export class CNCMachine extends THREE.Group {
    constructor(scene) {
        super();

        this.scene = scene;

        // Machine specifications (Haas UMC-750 style)
        this.specs = {
            xTravel: 762,    // 30" in mm
            yTravel: 508,    // 20" in mm
            zTravel: 508,    // 20" in mm
            aTravel: [-110, 110],  // A-axis tilt range
            bTravel: [0, 360],     // B-axis rotation
            maxSpindleSpeed: 12000, // RPM
            maxFeedrate: 25400      // mm/min (1000 ipm)
        };

        // Current axis positions
        this.axisPositions = {
            x: 0,
            y: 0,
            z: 100, // Start Z at safe height
            a: 0,
            b: 0
        };

        // Machine state
        this.state = {
            spindleRPM: 0,
            spindleRunning: false,
            coolantOn: false,
            feedrate: 1000,
            rapidMode: false,
            currentTool: 1
        };

        this.buildMachine();
    }

    buildMachine() {
        // Base and frame (Static Castings: Bed, Column, Pan)
        this.base = new MachineBase();
        this.add(this.base);

        // --- TRUNNION (A/B Axes) ---
        // Simplified setup: Trunnion sitting directly on the Bed
        this.trunnionTable = new TrunnionTable(this.specs.aTravel, this.specs.bTravel);
        // Position it on the bed (Bed top is roughly at Y=0.5)
        // Trunnion origin is its center of rotation roughly.
        this.trunnionTable.position.set(0, 0.55, 0.3);
        this.add(this.trunnionTable);

        // Enclosure (Static Outer Shell)
        this.enclosure = new Enclosure();
        this.add(this.enclosure);

        // Set all components to cast/receive shadows
        this.traverse(obj => {
            if (obj.isMesh) {
                obj.castShadow = true;
                obj.receiveShadow = true;
            }
        });
    }

    addLabel(text, position) {
        const label = this.create3DLabel(text);
        label.position.copy(position);
        this.add(label);
    }

    create3DLabel(text) {
        const div = document.createElement('canvas');
        div.width = 256;
        div.height = 64;
        const ctx = div.getContext('2d');

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // Semi-transparent black
        ctx.fillRect(0, 0, 256, 64);

        // Text
        ctx.fillStyle = '#00ffff'; // Cyan text
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 32);

        const texture = new THREE.CanvasTexture(div);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
            depthWrite: false
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(0.6, 0.15, 1); // Aspect ratio match
        sprite.renderOrder = 999;
        return sprite;
    }

    // Move axis to target position
    moveAxis(axis, position, rapid = false) {
        const oldPos = this.axisPositions[axis];

        // Validate position within travel limits
        const validatedPos = this.validatePosition(axis, position);
        this.axisPositions[axis] = validatedPos;

        // Update physical position
        this.updatePhysicalPosition(axis, validatedPos);

        return validatedPos;
    }

    validatePosition(axis, position) {
        switch (axis) {
            case 'x':
                return THREE.MathUtils.clamp(position, -this.specs.xTravel / 2, this.specs.xTravel / 2);
            case 'y':
                return THREE.MathUtils.clamp(position, -this.specs.yTravel / 2, this.specs.yTravel / 2);
            case 'z':
                return THREE.MathUtils.clamp(position, 0, this.specs.zTravel);
            case 'a':
                return THREE.MathUtils.clamp(position, this.specs.aTravel[0], this.specs.aTravel[1]);
            case 'b':
                // B-axis can rotate continuously
                return position % 360;
            default:
                return position;
        }
    }

    updatePhysicalPosition(axis, position) {
        switch (axis) {
            case 'x':
                if (this.xAxis) this.xAxis.setPosition(position);
                break;

            case 'y':
                if (this.yAxis) this.yAxis.setPosition(position);
                break;
            case 'z':
                if (this.zAxis) this.zAxis.setPosition(position);
                break;
            case 'a':
                if (this.trunnionTable) this.trunnionTable.setAAngle(position);
                break;
            case 'b':
                if (this.trunnionTable) this.trunnionTable.setBAngle(position);
                break;
        }
    }

    // Spindle control
    setSpindleSpeed(rpm, direction = 1) {
        this.state.spindleRPM = Math.min(rpm, this.specs.maxSpindleSpeed);
        this.state.spindleRunning = rpm > 0;

        if (this.spindle) {
            this.spindle.setSpeed(this.state.spindleRPM * direction);
        }
    }

    stopSpindle() {
        this.state.spindleRPM = 0;
        this.state.spindleRunning = false;

        if (this.spindle) {
            this.spindle.setSpeed(0);
        }
    }

    // Coolant control
    setCoolant(on) {
        this.state.coolantOn = on;
        // TODO: Trigger coolant particle effects
    }

    // Get current position for DRO display
    getCurrentPosition() {
        return { ...this.axisPositions };
    }

    // Update machine state each frame
    update(delta) {
        // Update spindle rotation
        if (this.spindle) {
            this.spindle.update(delta);
        }

        // Update any animations or movements
        // (smooth interpolation of axis movements could go here)
    }

    // Emergency stop
    emergencyStop() {
        this.stopSpindle();
        this.setCoolant(false);
        console.warn('EMERGENCY STOP ACTIVATED');
    }
}
