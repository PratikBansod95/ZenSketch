"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Point, Stroke } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MandalaCanvasProps {
    segments: number;
    color: string;
    brushSize: number;
    className?: string;
    onStrokeComplete: (stroke: Stroke) => void;
    strokes: Stroke[];
}

export default function MandalaCanvas({
    segments,
    color,
    brushSize,
    className,
    onStrokeComplete,
    strokes,
}: MandalaCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const tempCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const pointsRef = useRef<Point[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);

    // Helper to draw a single stroke with symmetry
    const drawSymmetry = useCallback((
        ctx: CanvasRenderingContext2D,
        points: Point[],
        strokeColor: string,
        strokeSize: number,
        segCount: number,
        width: number,
        height: number
    ) => {
        if (points.length < 2) return;

        const cx = width / 2;
        const cy = height / 2;
        const angleStep = (2 * Math.PI) / segCount;

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeSize;

        // Iterate segments
        for (let i = 0; i < segCount; i++) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(i * angleStep);

            ctx.beginPath();

            // Move to start relative to center
            ctx.moveTo(points[0].x - cx, points[0].y - cy);

            // Draw lines
            // For smoother lines, we could use quadraticCurveTo
            if (points.length < 3) {
                for (let j = 1; j < points.length; j++) {
                    ctx.lineTo(points[j].x - cx, points[j].y - cy);
                }
            } else {
                // Smooth curve
                let p1 = points[0];
                for (let j = 1; j < points.length; j++) {
                    const p2 = points[j];
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;
                    // Determine control point? 
                    // Actually standard quadratic smoothing:
                    // Start at first point.
                    // Curve to midpoint of current and next.
                    // Use current as control.

                    // Simple implementation:
                    // ctx.quadraticCurveTo(p1.x - cx, p1.y - cy, midX - cx, midY - cy);
                    // p1 = p2;
                }
                // For now, stick to lineTo for reliability
                for (let j = 1; j < points.length; j++) {
                    ctx.lineTo(points[j].x - cx, points[j].y - cy);
                }
            }

            ctx.stroke();
            ctx.restore();
        }
    }, []);

    // Redraw all strokes (persistent layer)
    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Check if canvas size matches container
        const rect = container.getBoundingClientRect();
        // Assuming size is synced in resize handler, but let's be safe
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);

        ctx.clearRect(0, 0, canvas.width, canvas.height); // clear physical pixels

        strokes.forEach(stroke => {
            drawSymmetry(ctx, stroke.points, stroke.color, stroke.size, stroke.segments, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
        });
    }, [strokes, drawSymmetry]);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (!containerRef.current || !canvasRef.current || !tempCanvasRef.current) return;

            const { width, height } = containerRef.current.getBoundingClientRect();
            const dbpr = window.devicePixelRatio || 1;

            [canvasRef.current, tempCanvasRef.current].forEach(canvas => {
                canvas.width = width * dbpr;
                canvas.height = height * dbpr;
                canvas.style.width = `${width}px`;
                canvas.style.height = `${height}px`;
                const ctx = canvas.getContext("2d");
                if (ctx) ctx.scale(dbpr, dbpr);
            });

            redraw();
        };

        window.addEventListener("resize", handleResize);
        // Initial size
        handleResize();

        // Also request animation frame to ensure it runs after layout
        requestAnimationFrame(handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, [redraw]);

    // Draw current stroke
    const drawCurrent = () => {
        const canvas = tempCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);

        ctx.clearRect(0, 0, width, height);
        if (pointsRef.current.length > 0) {
            drawSymmetry(ctx, pointsRef.current, color, brushSize, segments, width, height);
        }
    };

    const getPoint = (e: React.PointerEvent): Point => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        setIsDrawing(true);
        const p = getPoint(e);
        pointsRef.current = [p];
        drawCurrent();
        if (containerRef.current) containerRef.current.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDrawing) return;
        const p = getPoint(e);
        pointsRef.current.push(p);
        drawCurrent();
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDrawing) return;
        setIsDrawing(false);
        if (containerRef.current) containerRef.current.releasePointerCapture(e.pointerId);

        if (pointsRef.current.length > 1) {
            onStrokeComplete({
                points: [...pointsRef.current],
                color,
                size: brushSize,
                segments,
                id: Date.now().toString(),
            });
        }
        pointsRef.current = [];
        // Clear temp canvas
        const canvas = tempCanvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); // Use full clear
        }
    };

    return (
        <div
            ref={containerRef}
            className={cn("relative w-full h-full touch-none select-none", className)}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp} // End stroke if leaves, or maybe just stop adding points?
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
            />
            <canvas
                ref={tempCanvasRef}
                className="absolute inset-0 pointer-events-none"
            />
        </div>
    );
}
