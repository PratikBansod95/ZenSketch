"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import MandalaCanvas from "@/components/MandalaCanvas";
import Controls from "@/components/Controls";
import { Stroke, PASTEL_PALETTE } from "@/lib/types";

export default function Home() {
  const [segments, setSegments] = useState(6);
  const [color, setColor] = useState(PASTEL_PALETTE[0]);
  const [brushSize, setBrushSize] = useState(5);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[][]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  // Audio Refs
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize Audio
    ambientAudioRef.current = new Audio("/audio/ambient.mp3");
    ambientAudioRef.current.loop = true;
    ambientAudioRef.current.volume = 0.5;

    return () => {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
        ambientAudioRef.current = null;
      }
    };
  }, []);

  const toggleAudio = () => {
    if (!ambientAudioRef.current) return;
    if (isPlaying) {
      ambientAudioRef.current.pause();
    } else {
      ambientAudioRef.current.play().catch(() => {
        console.log("Audio autoplay failed");
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleStrokeComplete = useCallback((newStroke: Stroke) => {
    setUndoStack((prev) => [...prev, strokes]);
    setStrokes((prev) => [...prev, newStroke]);
    setRedoStack([]); // Clear redo stack on new action
  }, [strokes]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, strokes]);
    setStrokes(previousState);
    setUndoStack((prev) => prev.slice(0, -1));
  }, [strokes, undoStack]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, strokes]);
    setStrokes(nextState);
    setRedoStack((prev) => prev.slice(0, -1));
  }, [strokes, redoStack]);

  const handleClear = useCallback(() => {
    if (strokes.length === 0) return;
    setUndoStack((prev) => [...prev, strokes]);
    setStrokes([]);
    setRedoStack([]);
  }, [strokes]);

  const handleDownload = useCallback(() => {
    // Create a temporary canvas to draw the final image with background
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set dimensions (maybe limit for download size or use implementation dimensions?)
    // Using window size for now
    const width = window.innerWidth * window.devicePixelRatio;
    const height = window.innerHeight * window.devicePixelRatio;
    canvas.width = width;
    canvas.height = height;

    // Fill background (white or gradient? Stick to white for simple download)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Draw strokes
    const cx = width / 2;
    const cy = height / 2;

    strokes.forEach((stroke) => {
      const angleStep = (2 * Math.PI) / stroke.segments;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size * window.devicePixelRatio; // Scale stroke size? or keep 1:1 if coords are screen

      for (let i = 0; i < stroke.segments; i++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(i * angleStep);
        ctx.beginPath();

        // Replicate drawing logic (simple lines)
        if (stroke.points.length > 0) {
          // Important: Points are relative to top-left of screen. 
          // If we scale canvas, we need to respect that.
          // Points are in CSS pixels. Multiply by dpr.
          const dpr = window.devicePixelRatio;

          ctx.moveTo((stroke.points[0].x * dpr) - cx, (stroke.points[0].y * dpr) - cy);
          for (let j = 1; j < stroke.points.length; j++) {
            ctx.lineTo((stroke.points[j].x * dpr) - cx, (stroke.points[j].y * dpr) - cy);
          }
          ctx.stroke();
        }
        ctx.restore();
      }
    });

    // Trigger download
    const link = document.createElement("a");
    link.download = `mandala-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [strokes]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  return (
    <main className="relative w-full h-screen overflow-hidden">
      <MandalaCanvas
        className="z-0"
        segments={segments}
        color={color}
        brushSize={brushSize}
        onStrokeComplete={handleStrokeComplete}
        strokes={strokes}
      />

      <Controls
        segments={segments}
        setSegments={setSegments}
        color={color}
        setColor={setColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onDownload={handleDownload}
      />

      {/* Optional Audio Toggle Button (floating top right) */}
      <button
        onClick={toggleAudio}
        className="absolute top-4 right-4 p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-md hover:bg-white/40 transition-all text-gray-700 font-medium text-xs"
      >
        {isPlaying ? "Sound ON" : "Sound OFF"}
      </button>
    </main>
  );
}
