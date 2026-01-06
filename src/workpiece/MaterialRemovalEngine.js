import * as THREE from 'three';
import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';

export class MaterialRemovalEngine {
    constructor(workpiece) {
        this.workpiece = workpiece;
        this.evaluator = new Evaluator();
        this.cutHistory = [];
        this.totalVolumeRemoved = 0;
        this.isProcessing = false;

        // Convert workpiece to CSG Brush for boolean operations
        this.workpieceBrush = null;
        this.initializeWorkpieceBrush();
    }

    initializeWorkpieceBrush() {
        if (!this.workpiece || !this.workpiece.mesh) {
            console.error('Workpiece mesh not found');
            return;
        }

        // Create brush from workpiece geometry
        this.workpieceBrush = new Brush(this.workpiece.mesh.geometry);
        this.workpieceBrush.updateMatrixWorld();
    }

    // Perform cutting operation
    async cutWithTool(toolGeometry, toolPosition, toolRotation) {
        if (this.isProcessing) {
            console.warn('Material removal already in progress');
            return false;
        }

        this.isProcessing = true;

        try {
            // Create brush from tool geometry
            const toolBrush = new Brush(toolGeometry);

            // Set tool transformation
            toolBrush.position.copy(toolPosition);
            toolBrush.rotation.copy(toolRotation);
            toolBrush.updateMatrixWorld();

            // Perform CSG subtraction (workpiece - tool)
            const result = this.evaluator.evaluate(
                this.workpieceBrush,
                toolBrush,
                SUBTRACTION
            );

            if (result) {
                // Update workpiece geometry with result
                this.workpiece.mesh.geometry.dispose();
                this.workpiece.mesh.geometry = result.geometry;
                this.workpiece.mesh.geometry.computeVertexNormals();

                // Update the brush for next operation
                this.workpieceBrush = new Brush(result.geometry);
                this.workpieceBrush.updateMatrixWorld();

                // Record cut
                this.cutHistory.push({
                    position: toolPosition.clone(),
                    rotation: toolRotation.clone(),
                    timestamp: Date.now()
                });

                this.isProcessing = false;
                return true;
            }
        } catch (error) {
            console.error('Material removal error:', error);
            this.isProcessing = false;
            return false;
        }

        this.isProcessing = false;
        return false;
    }

    // Cut along a linear path (for feed moves)
    async cutAlongPath(toolGeometry, startPos, endPos, steps = 10) {
        const results = [];

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const position = new THREE.Vector3().lerpVectors(startPos, endPos, t);

            // For simplicity, no rotation change along path
            const rotation = new THREE.Euler(0, 0, 0);

            const success = await this.cutWithTool(toolGeometry, position, rotation);
            results.push(success);

            // Small delay to prevent blocking
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        return results.every(r => r);
    }

    // Simplified cutting for performance - just key positions
    async cutAtPosition(tool, position) {
        if (!tool || !this.workpiece) return false;

        // Get tool geometry
        const toolGeom = this.createToolCutGeometry(tool);
        if (!toolGeom) return false;

        const rotation = new THREE.Euler(0, 0, 0);
        return await this.cutWithTool(toolGeom, position, rotation);
    }

    createToolCutGeometry(tool) {
        // Create simplified cutting geometry based on tool type
        // This is a cylinder for now - would be more complex for actual endmill profile

        const radius = tool.diameter ? tool.diameter * 0.001 / 2 : 0.005; // mm to scene units
        const length = tool.length ? tool.length * 0.001 : 0.03;

        return new THREE.CylinderGeometry(radius, radius, length, 16);
    }

    // Get statistics
    getStats() {
        return {
            cutsPerformed: this.cutHistory.length,
            volumeRemoved: this.totalVolumeRemoved,
            isProcessing: this.isProcessing
        };
    }

    // Reset to original workpiece
    reset() {
        this.cutHistory = [];
        this.totalVolumeRemoved = 0;
        if (this.workpiece) {
            this.workpiece.reset();
            this.initializeWorkpieceBrush();
        }
    }

    // Cleanup
    dispose() {
        this.workpieceBrush = null;
        this.cutHistory = [];
    }
}
