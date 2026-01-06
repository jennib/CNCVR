export class GCodeParser {
    constructor() {
        this.reset();
    }

    reset() {
        this.commands = [];
        this.errors = [];
        this.lineNumber = 0;
    }

    parse(gcodeText) {
        this.reset();

        const lines = gcodeText.split('\n');

        for (let i = 0; i < lines.length; i++) {
            this.lineNumber = i + 1;
            const line = this.cleanLine(lines[i]);

            if (line.length === 0) continue;

            try {
                const command = this.parseLine(line);
                if (command) {
                    command.lineNumber = this.lineNumber;
                    command.originalLine = lines[i].trim();
                    this.commands.push(command);
                }
            } catch (error) {
                this.errors.push({
                    line: this.lineNumber,
                    message: error.message,
                    text: lines[i]
                });
            }
        }

        return {
            commands: this.commands,
            errors: this.errors,
            success: this.errors.length === 0
        };
    }

    cleanLine(line) {
        // Remove comments (everything after semicolon or parentheses)
        line = line.replace(/\(.*?\)/g, ''); // Remove (comment)
        line = line.replace(/;.*$/, '');      // Remove ; comment

        // Remove whitespace and convert to uppercase
        line = line.trim().toUpperCase();

        return line;
    }

    parseLine(line) {
        const command = {
            type: null,
            code: null,
            params: {}
        };

        // Split into words
        const words = line.match(/([A-Z])([-+]?\d*\.?\d+)/g);

        if (!words || words.length === 0) {
            return null;
        }

        // Parse each word
        for (const word of words) {
            const letter = word[0];
            const value = parseFloat(word.substring(1));

            if (letter === 'G') {
                command.type = 'G';
                command.code = value;
            } else if (letter === 'M') {
                command.type = 'M';
                command.code = value;
            } else if (letter === 'T') {
                command.type = 'T';
                command.code = value;
            } else {
                // Parameter (X, Y, Z, A, B, I, J, K, F, S, etc.)
                command.params[letter] = value;
            }
        }

        // If no G/M/T code found, but has parameters, it's a modal command
        if (!command.type && Object.keys(command.params).length > 0) {
            command.type = 'MODAL';
        }

        return command;
    }

    // Helper to get specific command types
    getCommandsByType(type) {
        return this.commands.filter(cmd => cmd.type === type);
    }

    getMotionCommands() {
        return this.commands.filter(cmd =>
            cmd.type === 'G' && [0, 1, 2, 3].includes(cmd.code)
        );
    }

    // Validate G-code (basic checks)
    validate() {
        const warnings = [];

        // Check for very large coordinates
        this.commands.forEach(cmd => {
            ['X', 'Y', 'Z', 'A', 'B'].forEach(axis => {
                if (cmd.params[axis] !== undefined) {
                    if (Math.abs(cmd.params[axis]) > 1000) {
                        warnings.push({
                            line: cmd.lineNumber,
                            message: `Large ${axis} coordinate: ${cmd.params[axis]}`,
                            severity: 'warning'
                        });
                    }
                }
            });
        });

        // Check for rapid moves (G0) with spindle running
        let spindleOn = false;
        this.commands.forEach(cmd => {
            if (cmd.type === 'M' && cmd.code === 3) spindleOn = true;
            if (cmd.type === 'M' && cmd.code === 5) spindleOn = false;

            if (cmd.type === 'G' && cmd.code === 0 && spindleOn) {
                warnings.push({
                    line: cmd.lineNumber,
                    message: 'Rapid move (G0) with spindle running',
                    severity: 'warning'
                });
            }
        });

        return warnings;
    }

    // Get statistics
    getStatistics() {
        const stats = {
            totalLines: this.commands.length,
            rapidMoves: 0,
            linearMoves: 0,
            arcMoves: 0,
            toolChanges: 0,
            spindleCommands: 0,
            modalCommands: 0
        };

        this.commands.forEach(cmd => {
            if (cmd.type === 'G') {
                if (cmd.code === 0) stats.rapidMoves++;
                if (cmd.code === 1) stats.linearMoves++;
                if (cmd.code === 2 || cmd.code === 3) stats.arcMoves++;
            }
            if (cmd.type === 'M') {
                if ([3, 4, 5].includes(cmd.code)) stats.spindleCommands++;
            }
            if (cmd.type === 'T') {
                stats.toolChanges++;
            }
            if (cmd.type === 'MODAL') {
                stats.modalCommands++;
            }
        });

        return stats;
    }
}
