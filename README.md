# ZenSketch (Web Edition)

A minimalist, oddly satisfying web app for calming tactile interaction.

### Features
- **Living Ink**: Responsive, organic strokes that react to speed and pressure.
- **Offline-First**: Function completely offline after initial load (PWA supported).
- **Session Focus**: 45s default session length followed by a gentle resolution.
- **Platform**: Optimized for mobile touch but works on desktop with trackpad/mouse.

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Vanilla CSS (Global & Modules)
- **Language**: TypeScript
- **PWA**: `next-pwa`

### How to Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deployment (Vercel)

1. Push to GitHub/GitLab.
2. Import project in Vercel.
3. Vercel automatically detects Next.js settings.
4. Deploy.

### Usage
- Draw on the canvas.
- Interact slowly for thick lines, quickly for thin lines.
- Pause to see ink "bloom".
- Valid input includes touch and mouse/trackpad.
- **Settings**: Long-press (2s) the top center of the screen to access hidden settings (Time, Sound, Theme).

### Offline Support
The app uses a Service Worker to cache assets. To test offline capabilities:
1. Run `npm run build` and `npm start`.
2. Open in browser.
3. Go offline.
4. Refresh page.

