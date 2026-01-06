import * as THREE from 'three';
import { GCodeParser } from './GCodeParser.js';
import { GCodeInterpreter } from './GCodeInterpreter.js';
import { PathVisualizer } from './PathVisualizer.js';

export class ProgramManager {
    constructor(scene, cncMachine, workpiece = null, chipGenerator = null, coolantSystem = null) {
        this.scene = scene;
        this.cncMachine = cncMachine;
        this.workpiece = workpiece;
        this.chipGenerator = chipGenerator;
        this.coolantSystem = coolantSystem;

        this.parser = new GCodeParser();
        this.interpreter = new GCodeInterpreter(cncMachine);
        this.pathVisualizer = new PathVisualizer();

        this.currentProgram = null;
        this.toolpath = [];
        this.isRunning = false;
        this.isPaused = false;
        this.currentLine = 0;
        this.playbackSpeed = 1.0;

        this.scene.add(this.pathVisualizer);
    }

    loadProgram(gcodeText) {
        const result = this.parser.parse(gcodeText);

        if (!result.success) {
            console.error('G-code parsing errors:', result.errors);
            return { success: false, errors: result.errors };
        }

        const warnings = this.parser.validate();
        if (warnings.length > 0) {
            console.warn('G-code warnings:', warnings);
        }

        const stats = this.parser.getStatistics();
        console.log('Program statistics:', stats);

        this.interpreter.reset();
        this.toolpath = this.interpreter.execute(result.commands);
        this.pathVisualizer.setToolpath(this.toolpath);

        this.currentProgram = {
            text: gcodeText,
            commands: result.commands,
            toolpath: this.toolpath,
            stats: stats,
            warnings: warnings
        };

        console.log(`Loaded program: ${this.toolpath.length} segments`);

        return {
            success: true,
            stats: stats,
            warnings: warnings,
            segmentCount: this.toolpath.length
        };
    }

    start() {
        if (!this.currentProgram) {
            console.error('No program loaded');
            return false;
        }

        this.isRunning = true;
        this.isPaused = false;
        this.currentLine = 0;

        console.log('Program started');
        return true;
    }

    pause() {
        this.isPaused = true;
        console.log('Program paused');
    }

    resume() {
        this.isPaused = false;
        console.log('Program resumed');
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentLine = 0;

        if (this.cncMachine) {
            this.cncMachine.stopSpindle();
        }

        console.log('Program stopped');
    }

    stepForward() {
        if (!this.currentProgram) return;

        if (this.currentLine < this.toolpath.length) {
            this.executeSegment(this.toolpath[this.currentLine]);
            this.currentLine++;
            this.pathVisualizer.setCurrentSegment(this.currentLine - 1);
        } else {
            console.log('End of program');
            this.stop();
        }
    }

    stepBackward() {
        if (this.currentLine > 0) {
            this.currentLine--;
            this.pathVisualizer.setCurrentSegment(this.currentLine);
        }
    }

    executeSegment(segment) {
        console.log(`Executing segment ${this.currentLine}:`, segment.type);
    }

    update(delta) {
        if (!this.isRunning || this.isPaused || !this.currentProgram) {
            return;
        }
    }

    showToolpath(visible) {
        this.pathVisualizer.setVisible(visible);
    }

    getProgramInfo() {
        if (!this.currentProgram) {
            return null;
        }

        return {
            stats: this.currentProgram.stats,
            warnings: this.currentProgram.warnings,
            totalSegments: this.toolpath.length,
            currentSegment: this.currentLine,
            progress: this.currentLine / this.toolpath.length,
            isRunning: this.isRunning,
            isPaused: this.isPaused
        };
    }

    setPlaybackSpeed(speed) {
        this.playbackSpeed = Math.max(0.1, Math.min(speed, 10.0));
    }

    loadSampleProgram() {
        const sampleGCode = `
; Sample 5-axis program
; Simple pocket with tilted approach

G21 ; Metric
G90 ; Absolute positioning
G54 ; Work coordinate system 1

; Tool change
T1 M6
S2000 M3 ; Spindle on at 2000 RPM

; Rapid to start position
G0 X0 Y0 Z50 A0 B0

; Position over workpiece
G0 X-25 Y-25 Z10

; Tilt A-axis for angled cut
G1 A15 F500

; Plunge
G1 Z-5 F200

; Pocket rectangular path
G1 X25 F800
G1 Y25
G1 X-25
G1 Y-25

; Return A-axis to zero
G1 A0 F500

; Retract
G0 Z50

; Rotate B-axis
G0 B90

; Another pass
G0 X0 Y0 Z10
G1 Z-5 F200
G1 X20 Y0 F800
G1 X0 Y20
G1 X-20 Y0
G1 X0 Y-20
G1 X0 Y0

; Return to home
G0 Z50
G0 B0
G0 X0 Y0

M5 ; Spindle off
M30 ; Program end
`;

        return this.loadProgram(sampleGCode);
    }
}
