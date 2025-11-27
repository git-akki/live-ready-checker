# Live Ready Checker

> **Professional streaming readiness analyzer**  Real-time audio, video, and network quality diagnostics

![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38b2ac?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

## Overview

**Live Ready Checker** is a modern, real-time streaming quality analyzer built for content creators. Quickly validate your microphone, camera, and network before going live with production-grade quality detection algorithms.

### Key Features

 **Audio Analysis**
- Real-time RMS amplitude monitoring
- Clipping and distortion detection
- Background noise assessment
- Microphone quality validation

 **Video Analysis**
- Brightness and exposure detection
- Lighting uniformity analysis
- Flicker and instability detection
- 16x16 grid-based frame sampling

 **Network Quality**
- Bitrate and packet loss monitoring
- Latency and jitter tracking
- Stability scoring (0-100)
- Multi-tier status indicators

 **Advanced Features**
- Live recording with timestamp capture
- Frame-by-frame diagnostics panel
- Detailed metric tooltips with explanations
- Export diagnostics for later review
- Minimal, modern UI inspired by ChatGPT

---

## Quick Start

### Prerequisites
- **Node.js** 18+ (or use un)
- Modern browser with WebRTC support

### Installation

\\\ash
# Clone the repository
git clone https://github.com/git-akki/live-ready-checker.git
cd live-ready-checker/client

# Install dependencies
npm install
# or with bun
bun install

# Start development server
npm run dev
# Server runs on http://localhost:5173
\\\

### Build for Production

\\\ash
npm run build
npm run preview
\\\

---

## Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18.3, TypeScript 5.6 |
| **Styling** | Tailwind CSS 3.4, CSS Variables |
| **Build Tool** | Vite 5.4 |
| **UI Components** | shadcn/ui + Radix UI |
| **Quality Detection** | Web Audio API, Canvas API, WebRTC |
| **State Management** | React Hooks (useState, useRef, useEffect) |

---

## Project Structure

\\\
client/
 src/
    components/          # React components
       ui/             # shadcn/ui components
       ChatSimulation.tsx
       DiagnosticsPanel.tsx
       RecordingModal.tsx
       VideoPreview.tsx
       ...
    hooks/              # Custom React hooks
       useMediaStream.ts       # Camera/microphone capture
       useQualityChecks.ts     # Real-time quality analysis
       useRecorder.ts          # Recording state management
       useChatSimulation.ts
    lib/
       qualityDetection.ts    # Core detection algorithms
       utils.ts
    pages/              # Page components
       CreatorTest.tsx        # Main streaming test page
       ViewerPreview.tsx
       NotFound.tsx
    App.tsx
    main.tsx
    index.css
 public/
 package.json
 tsconfig.json
 vite.config.ts
 tailwind.config.ts
 README.md
\\\

---

## Usage

### Basic Streaming Test

1. **Grant Permissions**: Allow access to camera and microphone
2. **Run Quick Checks**: Automatic quality analysis starts immediately
3. **Review Diagnostics**: Toggle "Simple/Advanced" for detailed metrics
4. **Record & Review**: Optional recording feature for content preview
5. **Go Live**: Proceed to streaming when all metrics are green

### Understanding Quality Metrics

#### Audio Status
-  **OK**: Audio is at optimal levels
-  **Background Noise**: Excessive ambient noise detected
-  **Too Quiet**: Audio below minimum threshold
-  **Too Loud**: Audio near/at clipping
-  **Clipping**: Distortion detected

#### Video Status
-  **OK**: Exposure and lighting are optimal
-  **Adjust Camera**: Flicker or instability detected
-  **Too Dark**: Insufficient lighting
-  **Uneven Lighting**: Inconsistent illumination across frame
-  **Overexposed**: Blown-out highlights

#### Network Status
-  **Good**: All network metrics in acceptable range
-  **Moderate**: Some metrics below optimal threshold
-  **Unstable**: Multiple issues detected
-  **Critical**: Connection unusable for streaming

---

## Quality Detection Algorithms

### Audio Detection
- **RMS Thresholds**: 0.01 (too quiet) to 0.7 (too loud)
- **Clipping Detection**: 5% threshold at -3dB headroom
- **Noise Floor**: 5th percentile of frequency content
- **Background Noise**: Ratio-based detection with sensitivity analysis

### Video Detection
- **Luminance Formula**: ITU-R BT.709 standard
- **Grid Sampling**: 16x16 blocks for fine-grained analysis
- **Brightness Range**: 30-180 (optimal 100)
- **Uniformity**: Standard deviation-based scoring
- **Flicker Detection**: 10-frame rolling average

### Network Detection
- **Bitrate Tiers**: Critical (250)  Poor (500)  Moderate (1000)  Optimal (1500+ kbps)
- **Latency**: <50ms (good) to >300ms (critical)
- **Packet Loss**: <0.5% (good) to >2% (poor)
- **Jitter Window**: 20-frame smoothing with exponential penalties

See QUALITY_DETECTION_IMPROVEMENTS.md for detailed algorithm documentation.

---

## Core Hooks

### \useMediaStream()\
Manages camera and microphone stream capture.

\\\	ypescript
const { stream, videoRef, isLoading, error } = useMediaStream();
\\\

### \useQualityChecks()\
Real-time quality analysis with diagnostics.

\\\	ypescript
const { 
  diagnosticData, 
  showDiagnostics, 
  isAnalyzing 
} = useQualityChecks(stream);
\\\

### \useRecorder()\
Recording state and timer management.

\\\	ypescript
const {
  isRecording,
  recordedBlob,
  recordingTime,
  startRecording,
  stopRecording
} = useRecorder(stream);
\\\

---

## API & Interfaces

### DiagnosticData
\\\	ypescript
interface DiagnosticData {
  audio: AudioAnalysis;
  video: VideoAnalysis;
  network: NetworkAnalysis;
  timestamp: number;
  overallStatus: "Good" | "Moderate" | "Poor" | "Critical";
}
\\\

### AudioAnalysis
\\\	ypescript
interface AudioAnalysis {
  rms: number;                          // Amplitude [0, 1]
  clipping: boolean;
  clippingPercent: number;
  noiseFloor: number;
  microphoneType: string;
  status: "OK" | "Too Quiet" | "Too Loud" | "Background Noise" | "Clipping";
}
\\\

### VideoAnalysis
\\\	ypescript
interface VideoAnalysis {
  brightness: number;                   // [0, 255]
  uniformityScore: number;              // [0, 1]
  uniformityStandardDev: number;
  faceDetected: boolean;
  facePercentOfFrame: number;
  status: "OK" | "Too Dark" | "Overexposed" | "Uneven Lighting" | "Adjust Camera";
}
\\\

### NetworkAnalysis
\\\	ypescript
interface NetworkAnalysis {
  bitrate: number;                      // kbps
  packetLoss: number;                   // percent
  jitter: number;                       // ms
  latency: number;                      // ms
  stabilityScore: number;               // [0, 100]
  status: "Good" | "Moderate" | "Unstable" | "Critical";
}
\\\

---

## Configuration

### Tailwind CSS Theme
3-color design system for consistency:

\\\css
--primary-green: hsl(34, 99%, 55%);     /* Actions, success */
--white: 0 0% 98%;                      /* Buttons, backgrounds */
--error-red: hsl(0, 100%, 50%);         /* Errors, critical */
\\\

### Vite Configuration
Development server runs on \http://localhost:5173\ with HMR enabled.

See \ite.config.ts\ for customization options.

---

## Development

### Available Scripts

\\\ash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm run type-check   # Type check with TypeScript
\\\

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: shadcn/ui recommended config
- **Prettier**: Auto-formatted on save
- **Tailwind**: Utility-first CSS

---

## Performance

### Optimization Targets
- **Audio Analysis**: <10ms per frame
- **Video Analysis**: <15ms per frame
- **Network Stats**: <5ms per collection
- **Total per cycle**: ~30ms (acceptable for 30fps)

### Bundle Size
- Vite optimizes for minimal bundle with code splitting
- shadcn/ui components tree-shaked
- ~150KB gzipped (before optimizations)

---

## Browser Support

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome/Edge 90+ |  Full Support | Recommended |
| Firefox 88+ |  Full Support | |
| Safari 14+ |  Full Support | Requires HTTPS |
| Mobile Safari |  Limited | WebRTC support varies |

**Required APIs:**
- WebRTC (\RTCPeerConnection\)
- Web Audio API
- Canvas API
- MediaStream API

---

## Troubleshooting

### Camera/Microphone Not Found
- Check browser permissions in settings
- Ensure HTTPS in production (WebRTC requirement)
- Try refreshing the page

### Quality Metrics Show "Offline"
- Verify network connectivity
- Check WebRTC connection state
- Review browser console for detailed logs

### Recording Fails
- Ensure sufficient disk space
- Check browser media permissions
- Verify codec compatibility

### High CPU Usage
- Reduce video resolution if possible
- Close other demanding applications
- Check for browser extensions interference

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create feature branch (\git checkout -b feature/amazing-feature\)
3. Commit changes (\git commit -m 'Add amazing feature'\)
4. Push to branch (\git push origin feature/amazing-feature\)
5. Open Pull Request

---

## Roadmap

- [ ] Face detection integration
- [ ] Speaker detection and analysis
- [ ] Bitrate recommendations
- [ ] Historical analytics dashboard
- [ ] Multi-streamer comparison
- [ ] Browser extension version

---

## License

This project is licensed under the MIT License. See LICENSE file for details.

---

## Support & Resources

-  [Web Audio API Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
-  [WebRTC Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
-  [GitHub Discussions](https://github.com/git-akki/live-ready-checker/discussions)
-  [Report Issues](https://github.com/git-akki/live-ready-checker/issues)

---

**Made with  for content creators**
