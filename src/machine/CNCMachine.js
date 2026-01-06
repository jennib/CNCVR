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

        // Machine specifications (Haas UMC-750 style - Upscaled for Reach)
        this.specs = {
            xTravel: 1200,   // ~47"
            yTravel: 800,    // ~31.5"
            zTravel: 800,    // Increased Z Travel
            aTravel: [-110, 110],  // A-axis tilt range
            bTravel: [0, 360],     // B-axis rotation
            maxSpindleSpeed: 12000,
            maxFeedrate: 25400
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
        this.base.rotation.y = -Math.PI / 2; // Rotate base to face Camera
        this.add(this.base);

        // --- Y-AXIS (Saddle Motion) ---
        // Moves Front/Back (Global Z). Rail aligned with Z.
        // LinearAxis default is X-aligned. Rotate Y 90deg -> Z-aligned.
        this.yAxis = new LinearAxis('Y', this.specs.yTravel);
        this.yAxis.rotation.y = Math.PI / 2;
        this.yAxis.position.set(0, 0.65, 0); // Sit on the bed
        this.add(this.yAxis);

        // Saddle (Visual)
        // Sitting on Y-Carriage
        const saddleGeo = new THREE.BoxGeometry(1.2, 0.15, 1.0);
        const saddleMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.4
        });
        const saddle = new THREE.Mesh(saddleGeo, saddleMat);
        saddle.position.y = 0.08;
        // Saddle needs to be flat visually. 
        // Y-Axis Object is Rotated Y 90.
        // Local X is Global Z. Local Z is Global -X.
        // We want Saddle Box (1.2 width) to be Left/Right (Global X).
        // Global X corresponds to Local -Z.
        // Box default is Width(X), Height(Y), Depth(Z).
        // 1.2 is along Local X (Global Z). We want it along Global X.
        // So Rotate Saddle Y 90?
        saddle.rotation.y = Math.PI / 2;
        this.yAxis.carriage.add(saddle);

        // --- X-AXIS (Table Motion) ---
        // Moves Left/Right (Global X). Rail aligned with X.
        // Sits on top of the Saddle (which is on Y-Carriage).
        this.xAxis = new LinearAxis('X', this.specs.xTravel);
        this.xAxis.rotation.set(0, 0, 0); // X-aligned default
        // Position relative to Saddle center.
        // Parent (Y Carriage) is Rotated Y 90.
        // Local X is G_Z. Local Z is G_-X.
        // We want X-Axis Rail (Along Local X of new object) to correspond to Global X.
        // If we add x-Axis to Y-Carriage (Rot Y 90):
        //   Child X aligns with Parent X (G_Z). FAIL.
        //   We need Child X to align with G_X (Parent -Z).
        //   Rotate Child Y -90?
        //   Parent(90) * Child(-90) = 0. Correct.
        this.xAxis.rotation.y = -Math.PI / 2;
        this.xAxis.position.set(0, 0.2, 0); // Stack on saddle
        this.yAxis.carriage.add(this.xAxis);

        // --- TRUNNION (A/B Axes) ---
        // Attached to the X-Carriage (The Table)
        this.trunnionTable = new TrunnionTable(this.specs.aTravel, this.specs.bTravel);
        this.trunnionTable.scale.set(0.6, 0.6, 0.6); // Scale down to ~600mm platter
        // Position on X-carriage
        this.trunnionTable.position.set(0, 0.05, 0);
        this.xAxis.carriage.add(this.trunnionTable);

        // --- Z-AXIS (Headstock Motion) ---
        // Attached to the machine base/column
        this.zAxis = new LinearAxis('Z', this.specs.zTravel);
        this.zAxis.rotation.set(0, 0, Math.PI / 2); // Rotate 90deg to be Vertical
        this.zAxis.position.set(0, 2.0, -0.8); // Higher (2.0) and Further Back (-0.8)
        this.add(this.zAxis);

        // Spindle Head (Mounted on Z-Carriage)
        this.spindle = new Spindle();
        // Z-Axis Local X is Global Y.
        // We will build Spindle geometry along X (Vertical) directly.
        // So no rotation needed here.
        this.spindle.rotation.set(0, 0, 0);
        this.spindle.position.set(0, 0, 0);
        this.zAxis.carriage.add(this.spindle);

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
                // Allow full travel from -Half to +Half (Center zero)
                return THREE.MathUtils.clamp(position, -this.specs.zTravel / 2, this.specs.zTravel / 2);
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

        // Lazy initialization of Tracker Visual
        if (this.trunnionTable && this.trunnionTable.platformGroup && !this.tracker) {
            this.tracker = new THREE.Mesh(
                new THREE.SphereGeometry(0.02),
                new THREE.MeshBasicMaterial({ color: 0xff0000 })
            );
            this.tracker.position.set(0.5, 0.08, 0); // Edge of platter
            this.trunnionTable.platformGroup.add(this.tracker);
        }

        // --- SIMULTANEOUS 5-AXIS TRACKING DEMO ---
        if (this.trunnionTable && this.xAxis && this.yAxis && this.zAxis) {
            const time = Date.now() * 0.0005; // Slower time

            // 1. Oscillate Rotary Axes
            // A-Axis: Tilt +/- 30 degrees (Trunnion)
            const aTarget = Math.sin(time) * 30;
            this.trunnionTable.setAAngle(aTarget);
            this.axisPositions.a = aTarget;

            // B-Axis: Rotate Continuous (Turntable)
            const bTarget = (time * 60) % 360; // 60 deg/sec
            this.trunnionTable.setBAngle(bTarget);
            this.axisPositions.b = bTarget;

            // 2. Kinematics Logic
            // Calculate vector 'v' from X-Carriage Origin to Tracker
            const scale = 0.6;
            const v = new THREE.Vector3(0.5, 0.08, 0).multiplyScalar(scale); // Tracker Local

            // Apply B (Around Y)
            v.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(bTarget));
            // Apply Platform Offset (0, -0.2, 0)
            v.add(new THREE.Vector3(0, -0.2, 0).multiplyScalar(scale));
            // Apply A (Around X)
            v.applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(aTarget));
            // Apply Cradle Pivot (0, 0.6, 0)
            v.add(new THREE.Vector3(0, 0.6, 0).multiplyScalar(scale));
            // Apply Trunnion Base (0, 0.05, 0)
            v.add(new THREE.Vector3(0, 0.05, 0).multiplyScalar(scale));

            // 'v' is now offset from X-Carriage (Axis Intersect?)

            // X-Axis Strategy: Keep Tracker at X=0.
            // WorldX_Tracker = X_Pos + v.x. 
            // 0 = X_Pos + v.x  =>  X_Pos = -v.x
            const targetX = -v.x * 1000;
            this.xAxis.setPosition(targetX);
            this.axisPositions.x = targetX;

            // Y-Axis Strategy: Keep Tracker at Spindle Z.
            // Spindle Z World ~ 0.05 (Rail -0.8 + Arm 0.85).
            // WorldZ_Tracker = Y_Pos + v.z. (Assuming Y-Axis moves in World Z).
            // User indicated Reversal: Y_Pos = v.z - 0.05.
            const targetY = (v.z - 0.05) * 1000;
            this.yAxis.setPosition(targetY);
            this.axisPositions.y = targetY;

            // Z-Axis Strategy: Keep Spindle Tip at Tracker Height.
            // TipWorldY = TrackerWorldY.
            // TipWorldY = (RailY 2.0) + Z_Pos + (TipOffset -0.85). = 1.15 + Z_Pos.
            // TrackerWorldY = (BaseY ~0.8) + v.y.
            // 1.15 + Z_Pos = 0.8 + v.y.
            // Z_Pos = v.y + 0.8 - 1.15 = v.y - 0.35.
            const targetZ = (v.y - 0.35) * 1000;
            this.zAxis.setPosition(targetZ);
            this.axisPositions.z = targetZ;
        }
    }

    // Emergency stop
    emergencyStop() {
        this.stopSpindle();
        this.setCoolant(false);
        console.warn('EMERGENCY STOP ACTIVATED');
    }
}
