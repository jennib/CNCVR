import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Workshop } from './environment/Workshop.js';
import { LightingSystem } from './environment/Lighting.js';
import { CNCMachine } from './machine/CNCMachine.js';
import { ControlPanel } from './controls/ControlPanel.js';
import { VRControllers } from './vr/VRControllers.js';
import { VRInteraction } from './vr/VRInteraction.js';
import { PerformanceMonitor } from './utils/PerformanceMonitor.js';
import { Workpiece } from './workpiece/Workpiece.js';
import { ProgramManager } from './gcode/ProgramManager.js';
import { ChipGenerator } from './effects/ChipGenerator.js';
import { CoolantSystem } from './effects/CoolantSystem.js';

class CNCSimulatorApp {
    constructor() {
        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.cncMachine = null;
        this.controlPanel = null;
        this.workpiece = null;
        this.programManager = null;
        this.chipGenerator = null;
        this.coolantSystem = null;
        this.vrControllers = null;
        this.vrInteraction = null;
        this.performanceMonitor = new PerformanceMonitor();

        this.init();
    }

    init() {
        this.scene.background = new THREE.Color(0x1a1a1a);
        this.scene.fog = new THREE.Fog(0x1a1a1a, 10, 50);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(2.5, 2.0, 3.5); // Closer initial view

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.xr.enabled = true;

        const appContainer = document.getElementById('app');
        appContainer.appendChild(this.renderer.domElement);

        const vrButton = VRButton.createButton(this.renderer);
        vrButton.id = 'vr-button';
        document.body.appendChild(vrButton);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.target.set(0, 1, 0);
        this.controls.maxDistance = 20;
        this.controls.minDistance = 0.5; // Allow getting very close

        this.buildScene();

        this.vrControllers = new VRControllers(this.renderer, this.scene, this.camera);
        this.vrInteraction = new VRInteraction(this.scene, this.camera, this.vrControllers);

        if (this.controlPanel) {
            this.vrInteraction.setControlPanel(this.controlPanel);
        }

        window.addEventListener('resize', this.onWindowResize.bind(this));

        setTimeout(() => {
            document.getElementById('loading').classList.add('hidden');
        }, 1000);

        this.renderer.setAnimationLoop(this.animate.bind(this));
    }

    buildScene() {
        const lighting = new LightingSystem(this.scene);
        const workshop = new Workshop(this.scene);

        this.cncMachine = new CNCMachine(this.scene);
        this.cncMachine.position.set(0, 0, 0);
        this.scene.add(this.cncMachine);

        // Workpiece removed

        this.controlPanel = new ControlPanel(this.scene, this.cncMachine);
        this.controlPanel.position.set(3, 0, 0);
        this.controlPanel.rotation.y = -Math.PI / 4;

        this.chipGenerator = new ChipGenerator(this.scene);
        this.coolantSystem = new CoolantSystem(this.scene);

        this.coolantSystem.setNozzlePosition(new THREE.Vector3(0, 2.5, 0));
        this.coolantSystem.setTargetPosition(new THREE.Vector3(0, 1.5, 0));

        this.programManager = new ProgramManager(
            this.scene,
            this.cncMachine,
            this.workpiece,
            this.chipGenerator,
            this.coolantSystem
        );

        setTimeout(() => {
            console.log('Loading sample 5-axis program...');
            const result = this.programManager.loadSampleProgram();
            if (result.success) {
                console.log('Sample program loaded successfully!');
                console.log('Statistics:', result.stats);
                console.log('Toolpath segments:', result.segmentCount);

                setTimeout(() => {
                    console.log('Generating demo chips...');
                    const chipPos = new THREE.Vector3(0, 1.5, 0);
                    const direction = new THREE.Vector3(1, 0.5, 0).normalize();
                    this.chipGenerator.generateChips(chipPos, direction, 'aluminum', 20);
                }, 2000);
            }
        }, 1000);

        if (this.vrInteraction) {
            this.vrInteraction.setControlPanel(this.controlPanel);
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        const delta = this.clock.getDelta();

        this.performanceMonitor.begin();

        if (!this.renderer.xr.isPresenting) {
            this.controls.update();
        }

        if (this.renderer.xr.isPresenting) {
            this.vrControllers.update();
            this.vrInteraction.update();
        }

        if (this.cncMachine) {
            this.cncMachine.update(delta);
        }

        if (this.controlPanel) {
            this.controlPanel.update(delta);
        }

        if (this.programManager) {
            this.programManager.update(delta);
        }

        if (this.workpiece) {
            this.workpiece.update(delta);
        }

        if (this.chipGenerator) {
            this.chipGenerator.update(delta);
        }

        if (this.coolantSystem) {
            this.coolantSystem.update(delta);
        }

        this.renderer.render(this.scene, this.camera);

        this.performanceMonitor.end();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new CNCSimulatorApp();
    });
} else {
    new CNCSimulatorApp();
}
