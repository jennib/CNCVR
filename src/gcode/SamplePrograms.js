// Sample G-code programs for testing

export const samplePrograms = {
    simple_pocket: `
; Simple rectangular pocket
G21 G90 G54
T1 M6
S2000 M3
G0 X0 Y0 Z50
G0 X-25 Y-25 Z10
G1 Z-5 F200
G1 X25 F800
G1 Y25
G1 X-25
G1 Y-25
G0 Z50
M5
M30
`,

    five_axis_demo: `
; 5-axis demonstration
G21 G90 G54
T1 M6
S2000 M3

; Start position
G0 X0 Y0 Z50 A0 B0

; Position 1 - Normal approach
G0 X-25 Y-25 Z10
G1 A15 F500
G1 Z-5 F200
G1 X25 F800
G1 A0
G0 Z50

; Position 2 - Rotated
G0 B90
G0 X0 Y-25 Z10
G1 Z-5 F200
G1 Y25 F800
G0 Z50

; Position 3 - Combined rotation
G0 B45
G1 A-20 F500
G0 X20 Y20 Z10
G1 Z-5 F200
G2 X-20 Y-20 I-20 J0 F600
G0 Z50

; Return home
G1 A0 F500
G0 B0
G0 X0 Y0 Z50

M5
M30
`,

    drilling_pattern: `
; Bolt hole pattern
G21 G90 G54
T2 M6 ; Drill tool
S1500 M3

; Define drill cycle
G81 X-30 Y-30 Z-10 R5 F150
X30 Y-30
X30 Y30
X-30 Y30
X0 Y0

G80 ; Cancel cycle
G0 Z50
M5
M30
`,

    surface_contour: `
; 3D surface contouring
G21 G90 G54
T1 M6
S3000 M3

G0 X-40 Y-40 Z10
G1 Z0 F200

; Layer 1
G1 X40 F1000
G3 X40 Y40 I0 J40
G1 X-40
G3 X-40 Y-40 I0 J-40

; Layer 2 with tilt
G1 A10 F500
G1 Z-3 F200
G1 X40 F1000
G2 X40 Y40 I0 J40
G1 X-40
G2 X-40 Y-40 I0 J-40

G1 A0 F500
G0 Z50
M5
M30
`,

    arc_test: `
; Arc interpolation test
G21 G90 G54
T1 M6
S2500 M3

G0 X0 Y0 Z10
G1 Z-2 F200

; Full circle CW
G2 X0 Y0 I20 J0 F600

; Full circle CCW
G3 X0 Y0 I-20 J0 F600

; Quarter arcs
G1 X20 Y0
G3 X0 Y20 I-20 J0
G3 X-20 Y0 I0 J-20
G3 X0 Y-20 I20 J0
G3 X20 Y0 I0 J20

G0 Z50
M5
M30
`
};

// Helper to get program by name
export function getSampleProgram(name) {
    return samplePrograms[name] || samplePrograms.simple_pocket;
}

// Get all program names
export function getSampleProgramNames() {
    return Object.keys(samplePrograms);
}
