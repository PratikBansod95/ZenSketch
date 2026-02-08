# ZenSketch

ZenSketch is a serene, web-based mandala drawing application inspired by Mandala_Mind. It offers a relaxing creative experience with symmetrical drawing tools, pastel color palettes, and glassmorphism UI.

## Features

- **Radial Symmetry**: Choose between 6, 8, 12, or 16 segments for intricate patterns.
- **Smooth Drawing**: Fluid brush strokes that mirror instantly across the canvas.
- **Glassmorphism UI**: A modern, translucent interface that keeps the focus on your art.
- **Responsive Design**: Works on desktop and mobile (touch-optimized).
- **Undo/Redo**: Experiment freely with full history support.
- **Download**: Save your creations as high-resolution PNG images.
- **Ambient Audio**: Support for background music (see Assets section).

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment on Vercel

1.  Push this repository to GitHub.
2.  Import the project in Vercel.
3.  Vercel will automatically detect Next.js.
4.  Click **Deploy**.

## Assets & Customization

### Audio
To enable background ambient music:
1.  Place an MP3 file named `ambient.mp3` in the `public/audio/` directory.
2.  The app will automatically load it. A mute toggle is available in the UI.

### Icons
Icons are provided by `lucide-react`. You can customize them in `src/components/Controls.tsx`.

## Project Structure

- `src/app/page.tsx`: Main application entry and state management.
- `src/components/MandalaCanvas.tsx`: Core drawing logic and symmetry engine.
- `src/components/Controls.tsx`: UI for tool selection.
- `src/lib/types.ts`: Type definitions and constants.
- `src/app/globals.css`: Global styles and animations.

## License

MIT
