import * as THREE from 'three';

export class PathVisualizer extends THREE.Group {
    constructor() {
        super();

        this.segments = [];
        this.currentSegmentIndex = -1;
        this.visible = true;
    }

    setToolpath(toolpath) {
        // Clear existing visualization
        this.clear();
        this.segments = [];

        toolpath.forEach((segment, index) => {
            const visual = this.createSegmentVisual(segment, index);
            if (visual) {
                this.add(visual);
                this.segments.push(visual);
            }
        });
    }

    createSegmentVisual(segment, index) {
        const group = new THREE.Group();
        group.userData.segment = segment;
        group.userData.index = index;

        const scale = 0.01; // mm to scene units

        switch (segment.type) {
            case 'rapid':
                return this.createRapidLine(segment, scale);
            case 'linear':
                return this.createLinearLine(segment, scale);
            case 'arc_cw':
            case 'arc_ccw':
                return this.createArcLine(segment, scale);
            case 'drill':
                return this.createDrillPoint(segment, scale);
            default:
                return null;
        }
    }

    createRapidLine(segment, scale) {
        const start = new THREE.Vector3(
            segment.start.x * scale,
            segment.start.z * scale,
            segment.start.y * scale
        );
        const end = new THREE.Vector3(
            segment.end.x * scale,
            segment.end.z * scale,
            segment.end.y * scale
        );

        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineDashedMaterial({
            color: 0x00ff00,
            linewidth: 2,
            dashSize: 0.02,
            gapSize: 0.01,
            transparent: true,
            opacity: 0.7
        });

        const line = new THREE.Line(geometry, material);
        line.computeLineDistances();

        return line;
    }

    createLinearLine(segment, scale) {
        const start = new THREE.Vector3(
            segment.start.x * scale,
            segment.start.z * scale,
            segment.start.y * scale
        );
        const end = new THREE.Vector3(
            segment.end.x * scale,
            segment.end.z * scale,
            segment.end.y * scale
        );

        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineBasicMaterial({
            color: 0xff6600,
            linewidth: 3,
            transparent: true,
            opacity: 0.9
        });

        const line = new THREE.Line(geometry, material);

        return line;
    }

    createArcLine(segment, scale) {
        // Simplified arc - we'll draw it as a curve
        const start = new THREE.Vector3(
            segment.start.x * scale,
            segment.start.z * scale,
            segment.start.y * scale
        );
        const end = new THREE.Vector3(
            segment.end.x * scale,
            segment.end.z * scale,
            segment.end.y * scale
        );

        // For now, approximate with straight line
        // TODO: Implement proper arc interpolation based on I, J, K or R
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineBasicMaterial({
            color: 0x00aaff,
            linewidth: 3,
            transparent: true,
            opacity: 0.9
        });

        const line = new THREE.Line(geometry, material);

        return line;
    }

    createDrillPoint(segment, scale) {
        const position = new THREE.Vector3(
            segment.position.x * scale,
            segment.retract * scale,
            segment.position.y * scale
        );

        const geometry = new THREE.SphereGeometry(0.005, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });

        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(position);

        // Add drill depth line
        const depthGeometry = new THREE.BufferGeometry().setFromPoints([
            position,
            new THREE.Vector3(position.x, segment.depth * scale, position.z)
        ]);
        const depthMaterial = new THREE.LineDashedMaterial({
            color: 0xff0000,
            linewidth: 2,
            dashSize: 0.01,
            gapSize: 0.005
        });
        const depthLine = new THREE.Line(depthGeometry, depthMaterial);
        depthLine.computeLineDistances();

        const group = new THREE.Group();
        group.add(sphere);
        group.add(depthLine);

        return group;
    }

    // Highlight current segment being executed
    setCurrentSegment(index) {
        // Reset previous
        if (this.currentSegmentIndex >= 0 && this.segments[this.currentSegmentIndex]) {
            const prev = this.segments[this.currentSegmentIndex];
            if (prev.material) {
                prev.material.opacity = 0.7;
            }
        }

        // Highlight current
        this.currentSegmentIndex = index;
        if (index >= 0 && this.segments[index]) {
            const current = this.segments[index];
            if (current.material) {
                current.material.opacity = 1.0;
                current.material.emissive = new THREE.Color(0xffff00);
                current.material.emissiveIntensity = 0.5;
            }
        }
    }

    // Show/hide toolpath
    setVisible(visible) {
        this.visible = visible;
        this.traverse(obj => {
            if (obj.material) {
                obj.visible = visible;
            }
        });
    }

    // Clear all visualizations
    clear() {
        while (this.children.length > 0) {
            const child = this.children[0];
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
            this.remove(child);
        }
        this.segments = [];
        this.currentSegmentIndex = -1;
    }

    // Get bounding box of entire toolpath
    getBoundingBox() {
        const box = new THREE.Box3();
        this.traverse(obj => {
            if (obj.geometry) {
                box.expandByObject(obj);
            }
        });
        return box;
    }
}
