import * as THREE from 'three';

export class SimplifiedCutting {
    /**
     * Simplified cutting system that modifies workpiece without heavy CSG
     * Uses vertex displacement instead of boolean operations for better performance
     */
    constructor(workpiece) {
        this.workpiece = workpiece;
        this.cutHistory = [];
    }

    // Perform a simplified cut by displacing vertices near the tool
    async cutWithTool(toolPosition, toolRadius = 0.005) {
        if (!this.workpiece || !this.workpiece.mesh) {
            return false;
        }

        const geometry = this.workpiece.mesh.geometry;
        const position = geometry.attributes.position;

        let verticesModified = 0;
        const cutDepth = 0.002; // 2mm cut depth

        // Iterate through vertices and displace those within tool radius
        for (let i = 0; i < position.count; i++) {
            const vertex = new THREE.Vector3(
                position.getX(i),
                position.getY(i),
                position.getZ(i)
            );

            // Transform to world space
            vertex.applyMatrix4(this.workpiece.mesh.matrixWorld);

            // Check distance from tool
            const distance = vertex.distanceTo(toolPosition);

            if (distance < toolRadius) {
                // Displace vertex downward (cutting action)
                const displacement = Math.max(0, toolRadius - distance) * cutDepth;

                // Apply displacement in local space
                const localVertex = vertex.clone().applyMatrix4(
                    this.workpiece.mesh.matrixWorld.clone().invert()
                );

                position.setY(i, localVertex.y - displacement);
                verticesModified++;
            }
        }

        if (verticesModified > 0) {
            position.needsUpdate = true;
            geometry.computeVertexNormals();

            this.cutHistory.push({
                position: toolPosition.clone(),
                verticesModified: verticesModified,
                timestamp: Date.now()
            });

            return true;
        }

        return false;
    }

    // Get statistics
    getStats() {
        return {
            cutsPerformed: this.cutHistory.length,
            totalVerticesModified: this.cutHistory.reduce((sum, cut) => sum + cut.verticesModified, 0)
        };
    }

    // Reset (would need to restore original geometry)
    reset() {
        this.cutHistory = [];
        // Note: Original geometry should be backed up before cutting
    }

    dispose() {
        this.cutHistory = [];
    }
}
