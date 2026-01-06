import * as THREE from 'three';

export class GCodeInterpreter {
    constructor(cncMachine) {
        this.cncMachine = cncMachine;
        this.reset();
    }

    reset() {
        // Machine state
        this.state = {
            // Modal groups
            motionMode: 0,        // G0, G1, G2, G3
            plane: 17,            // G17 (XY), G18 (XZ), G19 (YZ)
            units: 21,            // G21 (mm), G20 (inches)
            coordinateSystem: 54, // G54-G59
            positioning: 90,      // G90 (absolute), G91 (incremental)

            // Current position
            position: { x: 0, y: 0, z: 0, a: 0, b: 0 },

            // Current settings
            feedrate: 100,        // mm/min
            spindleSpeed: 0,      // RPM
            currentTool: 1,

            // Offsets
            workOffset: { x: 0, y: 0, z: 0 },
            toolOffset: { x: 0, y: 0, z: 0 }
        };

        this.toolpath = [];
        this.currentSegment = null;
    }

    // Execute a list of parsed commands
    execute(commands) {
        this.toolpath = [];

        commands.forEach(cmd => {
            try {
                this.executeCommand(cmd);
            } catch (error) {
                console.error(`Error executing line ${cmd.lineNumber}:`, error.message);
            }
        });

        return this.toolpath;
    }

    executeCommand(cmd) {
        switch (cmd.type) {
            case 'G':
                this.executeGCode(cmd);
                break;
            case 'M':
                this.executeMCode(cmd);
                break;
            case 'T':
                this.executeToolChange(cmd);
                break;
            case 'MODAL':
                // Use current motion mode
                this.executeModalCommand(cmd);
                break;
        }
    }

    executeGCode(cmd) {
        const g = cmd.code;
        const params = cmd.params;

        // Motion commands
        if (g === 0 || g === 1) {
            this.executeLinearMove(g, params);
        } else if (g === 2 || g === 3) {
            this.executeArcMove(g, params);
        }
        // Plane selection
        else if (g >= 17 && g <= 19) {
            this.state.plane = g;
        }
        // Units
        else if (g === 20 || g === 21) {
            this.state.units = g;
        }
        // Coordinate system
        else if (g >= 54 && g <= 59) {
            this.state.coordinateSystem = g;
        }
        // Positioning mode
        else if (g === 90 || g === 91) {
            this.state.positioning = g;
        }
        // Canned cycles (drilling, etc.)
        else if (g >= 81 && g <= 89) {
            this.executeCannedCycle(g, params);
        }
        // Set work offset
        else if (g === 92) {
            this.setWorkOffset(params);
        }

        // Store current motion mode for modal commands
        if ([0, 1, 2, 3].includes(g)) {
            this.state.motionMode = g;
        }
    }

    executeLinearMove(g, params) {
        const startPos = { ...this.state.position };
        const endPos = this.calculateEndPosition(params);

        // Create toolpath segment
        const segment = {
            type: g === 0 ? 'rapid' : 'linear',
            start: startPos,
            end: endPos,
            feedrate: g === 1 ? this.state.feedrate : null,
            spindleSpeed: this.state.spindleSpeed,
            tool: this.state.currentTool
        };

        this.toolpath.push(segment);

        // Update position
        this.state.position = endPos;

        // Update machine if connected
        if (this.cncMachine) {
            Object.keys(endPos).forEach(axis => {
                this.cncMachine.moveAxis(axis, endPos[axis], g === 0);
            });
        }

        // Update feedrate if specified
        if (params.F !== undefined) {
            this.state.feedrate = params.F;
        }
    }

    executeArcMove(g, params) {
        const startPos = { ...this.state.position };
        const endPos = this.calculateEndPosition(params);

        // Arc parameters
        const i = params.I || 0;
        const j = params.J || 0;
        const k = params.K || 0;
        const r = params.R;

        const segment = {
            type: g === 2 ? 'arc_cw' : 'arc_ccw',
            start: startPos,
            end: endPos,
            center: { i, j, k },
            radius: r,
            plane: this.state.plane,
            feedrate: this.state.feedrate,
            spindleSpeed: this.state.spindleSpeed,
            tool: this.state.currentTool
        };

        this.toolpath.push(segment);

        // Update position
        this.state.position = endPos;

        // For now, we'll move linearly to end point
        // TODO: Implement proper arc interpolation
        if (this.cncMachine) {
            Object.keys(endPos).forEach(axis => {
                this.cncMachine.moveAxis(axis, endPos[axis], false);
            });
        }
    }

    executeCannedCycle(g, params) {
        // Simplified canned cycle (drilling)
        // G81: Standard drill
        // G83: Peck drill

        const x = params.X !== undefined ? params.X : this.state.position.x;
        const y = params.Y !== undefined ? params.Y : this.state.position.y;
        const z = params.Z; // Final depth
        const r = params.R; // Retract height

        if (z === undefined || r === undefined) {
            throw new Error('Canned cycle requires Z and R parameters');
        }

        const segment = {
            type: 'drill',
            cycle: g,
            position: { x, y },
            depth: z,
            retract: r,
            feedrate: this.state.feedrate,
            tool: this.state.currentTool
        };

        this.toolpath.push(segment);
    }

    executeMCode(cmd) {
        const m = cmd.code;
        const params = cmd.params;

        switch (m) {
            case 3: // Spindle on CW
                this.state.spindleSpeed = params.S || this.state.spindleSpeed;
                if (this.cncMachine) {
                    this.cncMachine.setSpindleSpeed(this.state.spindleSpeed, 1);
                }
                break;

            case 4: // Spindle on CCW
                this.state.spindleSpeed = params.S || this.state.spindleSpeed;
                if (this.cncMachine) {
                    this.cncMachine.setSpindleSpeed(this.state.spindleSpeed, -1);
                }
                break;

            case 5: // Spindle stop
                this.state.spindleSpeed = 0;
                if (this.cncMachine) {
                    this.cncMachine.stopSpindle();
                }
                break;

            case 6: // Tool change
                // Handled by T command
                break;

            case 8: // Coolant on
                if (this.cncMachine) {
                    this.cncMachine.setCoolant(true);
                }
                break;

            case 9: // Coolant off
                if (this.cncMachine) {
                    this.cncMachine.setCoolant(false);
                }
                break;

            case 30: // Program end
            case 2: // Program end
                console.log('Program end');
                break;
        }
    }

    executeToolChange(cmd) {
        this.state.currentTool = cmd.code;
        console.log(`Tool change to T${cmd.code}`);

        // TODO: Trigger tool changer animation
    }

    executeModalCommand(cmd) {
        // Execute command using current motion mode
        if (this.state.motionMode === 0 || this.state.motionMode === 1) {
            this.executeLinearMove(this.state.motionMode, cmd.params);
        } else if (this.state.motionMode === 2 || this.state.motionMode === 3) {
            this.executeArcMove(this.state.motionMode, cmd.params);
        }
    }

    calculateEndPosition(params) {
        const endPos = { ...this.state.position };

        if (this.state.positioning === 90) {
            // Absolute positioning
            if (params.X !== undefined) endPos.x = params.X;
            if (params.Y !== undefined) endPos.y = params.Y;
            if (params.Z !== undefined) endPos.z = params.Z;
            if (params.A !== undefined) endPos.a = params.A;
            if (params.B !== undefined) endPos.b = params.B;
        } else {
            // Incremental positioning (G91)
            if (params.X !== undefined) endPos.x += params.X;
            if (params.Y !== undefined) endPos.y += params.Y;
            if (params.Z !== undefined) endPos.z += params.Z;
            if (params.A !== undefined) endPos.a += params.A;
            if (params.B !== undefined) endPos.b += params.B;
        }

        return endPos;
    }

    setWorkOffset(params) {
        if (params.X !== undefined) this.state.workOffset.x = this.state.position.x - params.X;
        if (params.Y !== undefined) this.state.workOffset.y = this.state.position.y - params.Y;
        if (params.Z !== undefined) this.state.workOffset.z = this.state.position.z - params.Z;
    }

    getToolpath() {
        return this.toolpath;
    }

    getState() {
        return { ...this.state };
    }
}
