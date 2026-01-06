# CNC Simulator VR

A high-fidelity 5-axis CNC machine simulator built with Three.js and WebXR, optimized for Meta Quest 2/3.

## Features

- **Realistic 5-Axis CNC Machine** - Modeled after Haas UMC-750 style vertical machining center
  - X, Y, Z linear axes with ball screws and servo motors
  - A-axis tilt (±110°) and B-axis rotation (360°) trunnion table
  - High-speed spindle with interchangeable tools
  - Safety enclosure with transparent windows
  
- **Interactive Control Panel** - Digital readout display and manual controls
  - Live axis position display (DRO)
  - Jog controls for all 5 axes
  - Spindle speed controls
  - Emergency stop

- **VR Support** - Full WebXR implementation for Quest 2/3
  - Hand controller support with haptic feedback
  - Raycasting interaction system
  - VR-optimized rendering (72-90Hz target)
  
- **Workshop Environment** - Realistic industrial setting
  - Epoxy floor with grid
  - Industrial walls and ceiling
  - Workshop furniture and details
  - Professional lighting system

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The dev server will start with HTTPS at `https://localhost:3000` (HTTPS is required for WebXR).

### Production Build

```bash
npm run build
npm run preview
```

## Testing in VR (Quest 2/3)

### Option 1: Meta Quest Link (Wired/Wireless)

1. Enable Developer Mode on your Quest headset
2. Connect Quest to PC via USB cable or use Air Link
3. Open the dev server URL in your PC browser
4. Click "ENTER VR" button

### Option 2: Direct to Headset (Network)

1. Ensure your Quest and PC are on the same network
2. Start the dev server with `npm run dev`
3. Note the HTTPS URL (e.g., `https://192.168.1.x:3000`)
4. In Quest browser, navigate to the URL
5. Accept the self-signed certificate warning
6. Click "ENTER VR"

## Controls

### Desktop Mode

- **Left Mouse + Drag** - Rotate camera
- **Right Mouse + Drag** - Pan camera
- **Scroll Wheel** - Zoom in/out

### VR Mode

- **Trigger** - Select/Press buttons
- **Grip** - Grab objects (future feature)
- **Thumbstick** - Teleport (future feature)
- **Point at control panel** - Interact with machine controls

## Machine Specifications 

Based on Haas UMC-750 SS:

- **X-Axis Travel**: 762mm (30")
- **Y-Axis Travel**: 508mm (20")
- **Z-Axis Travel**: 508mm (20")
- **A-Axis (Tilt)**: ±110°
- **B-Axis (Rotation)**: 360° continuous
- **Spindle Speed**: 0-12,000 RPM
- **Max Feed Rate**: 25,400 mm/min (1000 IPM)

## Project Structure

```
cncSimulator/
├── src/
│   ├── main.js                 # Application entry point
│   ├── controls/
│   │   └── ControlPanel.js     # Interactive control panel
│   ├── environment/
│   │   ├── Lighting.js         # Lighting system
│   │   └── Workshop.js         # Workshop environment
│   ├── machine/
│   │   ├── CNCMachine.js       # Main machine controller
│   │   └── components/
│   │       ├── MachineBase.js  # Machine base/frame
│   │       ├── LinearAxis.js   # X/Y/Z axes
│   │       ├── TrunnionTable.js # A/B rotary axes
│   │       ├── Spindle.js      # Spindle assembly
│   │       └── Enclosure.js    # Safety enclosure
│   ├── vr/
│   │   ├── VRControllers.js    # Quest controller support
│   │   └── VRInteraction.js    # VR interaction system
│   └── utils/
│       └── PerformanceMonitor.js # FPS/performance tracking
├── index.html
├── package.json
└── vite.config.js
```

## Roadmap

### Phase 1: Core Functionality (Current)
- [x] 5-axis machine model
- [x] VR controller support
- [x] Interactive control panel
- [x] Manual jog controls
- [ ] G-code parser and interpreter
- [ ] Material removal simulation

### Phase 2: Advanced Features
- [ ] G-code file upload
- [ ] Toolpath visualization
- [ ] CSG-based material removal
- [ ] Realistic chip generation
- [ ] Coolant effects
- [ ] Audio system (spindle, servos, cutting sounds)

### Phase 3: Polish
- [ ] Tool library and auto tool changer
- [ ] Multiple workpiece materials
- [ ] Advanced VR interactions (teleportation, grabbing)
- [ ] Performance optimizations for complex cuts
- [ ] Tutorial/onboarding system

## Performance Tips

- Target framerate is 72-90 FPS for VR
- Use Chrome or Edge for best WebXR support
- Ensure Quest firmware is up to date
- Close other applications during VR use
- Performance monitor displays in top-right corner

## Technology Stack

- **Three.js** (r160+) - 3D rendering
- **WebXR Device API** - VR support
- **Vite** - Build tool and dev server
- **three-mesh-bvh** - Accelerated raycasting/CSG
- **cannon-es** - Physics engine

## Troubleshooting

### "ENTER VR" button not appearing
- Ensure you're using HTTPS
- Check WebXR browser support
- Try Chrome/Edge browsers
- Verify Quest is in Developer Mode

### Poor performance in VR
- Close other browser tabs
- Reduce shadow quality in code
- Disable post-processing effects
- Check FPS monitor for bottlenecks

### Self-signed certificate error
- This is normal for local HTTPS development
- Click "Advanced" and proceed anyway
- Quest browser will remember your choice

## Contributing

This is a demonstration project. Contributions and suggestions are welcome!

## License

MIT

## Credits

Modeled after Haas Automation CNC machines  
Built with Three.js and WebXR
