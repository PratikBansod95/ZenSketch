'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { drawStroke, getStrokePoints } from '@/lib/ink';
import { soundEngine } from '@/lib/audio';

// --- Types ---
type Point = { x: number; y: number; pressure: number; time: number };
type Stroke = {
    points: Point[];
    color: string;
    phase: 'drawing' | 'settling' | 'breathing' | 'resolving';
    birthTime: number;
    opacity: number;
};
type Settings = { sessionLength: number; soundEnabled: boolean; theme: 'light' | 'dark' };

// --- Constants ---
const DEFAULT_SETTINGS: Settings = { sessionLength: 45, soundEnabled: true, theme: 'light' };
const RESOLUTION_DURATION = 2000;

export default function ZenSketch() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [sessionState, setSessionState] = useState<'idle' | 'active' | 'resolving'>('idle');
    const [showSettings, setShowSettings] = useState(false);

    // Refs for animation loop
    const strokesRef = useRef<Stroke[]>([]);
    const currentStrokeRef = useRef<Point[]>([]);
    const isDrawingRef = useRef(false);
    const animationFrameRef = useRef<number>(0);
    const sessionStartTimeRef = useRef<number>(0);

    // Settings Long Press
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

    // --- Canvas Setup ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            if (!containerRef.current || !canvas) return;
            const { width, height } = containerRef.current.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            const ctx = canvas.getContext('2d');
            if (ctx) ctx.scale(dpr, dpr);
        };

        window.addEventListener('resize', resize);
        resize();

        // Init sound on first interaction (handled in listeners)

        return () => window.removeEventListener('resize', resize);
    }, []);

    // --- Core Interaction Logic ---
    const startStroke = useCallback((e: React.PointerEvent) => {
        if (sessionState === 'resolving') return;

        // Init sound context if needed
        if (settings.soundEnabled) soundEngine.start();

        if (sessionState === 'idle') {
            setSessionState('active');
            sessionStartTimeRef.current = Date.now();
        }

        isDrawingRef.current = true;

        // Lock pointer for trackpad/mouse
        if (e.pointerType === 'mouse') {
            // (canvasRef.current as any).requestPointerLock();
        }

        const { clientX, clientY, pressure } = e;
        const rect = canvasRef.current!.getBoundingClientRect();
        const point = {
            x: clientX - rect.left,
            y: clientY - rect.top,
            pressure: pressure !== 0.5 ? pressure : 0.5, // Default 0.5 if not supported
            time: Date.now()
        };

        currentStrokeRef.current = [point];
    }, [sessionState, settings.soundEnabled]);

    const moveStroke = useCallback((e: React.PointerEvent) => {
        if (!isDrawingRef.current) return;

        // Coalesced events for smoother input
        // @ts-ignore
        const events = (e.nativeEvent && typeof e.nativeEvent.getCoalescedEvents === 'function')
            ? (e.nativeEvent as any).getCoalescedEvents()
            : [e];

        const rect = canvasRef.current!.getBoundingClientRect();

        let avgSpeed = 0;

        events.forEach((event: React.PointerEvent | PointerEvent) => {
            const clientX = (event as any).clientX;
            const clientY = (event as any).clientY;
            const pressure = (event as any).pressure;

            const point = {
                x: clientX - rect.left,
                y: clientY - rect.top,
                pressure: pressure !== 0.5 ? pressure : 0.5,
                time: Date.now()
            };

            // Calculate speed for sound
            const last = currentStrokeRef.current[currentStrokeRef.current.length - 1];
            if (last) {
                const dist = Math.hypot(point.x - last.x, point.y - last.y);
                const dt = point.time - last.time;
                if (dt > 0) avgSpeed = dist / dt;
            }

            currentStrokeRef.current.push(point);
        });

        if (settings.soundEnabled) {
            soundEngine.update(avgSpeed, e.pressure);
        }
    }, [settings.soundEnabled]);

    const endStroke = useCallback(() => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;

        if (settings.soundEnabled) {
            soundEngine.update(0, 0); // Fade out
        }

        if (currentStrokeRef.current.length > 0) {
            // Apply smoothing
            const points = getStrokePoints(currentStrokeRef.current);

            strokesRef.current.push({
                points,
                color: settings.theme === 'dark' ? '#EDEDED' : '#171717',
                phase: 'drawing', // Transition to breathing/settling
                birthTime: Date.now(),
                opacity: 1
            });
        }
        currentStrokeRef.current = [];
    }, [settings.theme, settings.soundEnabled]);

    // --- Rendering Loop ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let noiseOffset = 0;

        const render = () => {
            if (!ctx || !canvas) return;
            const now = Date.now();

            // Check Session Time
            if (sessionState === 'active' && now - sessionStartTimeRef.current > settings.sessionLength * 1000) {
                setSessionState('resolving');
            }

            // Handling Resolution
            if (sessionState === 'resolving') {
                // Dissolve behavior
                strokesRef.current.forEach(stroke => {
                    stroke.phase = 'resolving';
                    stroke.opacity -= 0.01;
                });
                strokesRef.current = strokesRef.current.filter(s => s.opacity > 0);

                if (strokesRef.current.length === 0 && currentStrokeRef.current.length === 0) {
                    // Reset after delay
                    if (Math.random() > 0.95) setSessionState('idle'); // Just loop back to idle
                }
            }

            const { width, height } = canvas.getBoundingClientRect();
            ctx.clearRect(0, 0, width, height);

            // Draw Completed Strokes
            strokesRef.current.forEach(stroke => {
                ctx.globalAlpha = stroke.opacity;
                // Apply slight "breathing" scale or offset based on time?
                // Spec: "Line performs one slow 'breath' animation (expand -> contract -> settle)"
                // We can simulate this by re-calculating widths in drawStroke if we passed a multiplier.
                // For now, static drawing to keep 60fps stable.
                drawStroke(ctx, stroke.points, stroke.color, now);
            });

            // Draw Current Stroke
            if (currentStrokeRef.current.length > 0) {
                ctx.globalAlpha = 1;
                const color = settings.theme === 'dark' ? '#EDEDED' : '#171717';
                drawStroke(ctx, currentStrokeRef.current, color, now);
            }

            ctx.globalAlpha = 1; // Reset

            noiseOffset += 0.01;
            animationFrameRef.current = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [sessionState, settings]);

    // --- Settings Interaction ---
    const handleSettingsTouchStart = () => {
        longPressTimerRef.current = setTimeout(() => {
            setShowSettings(true);
        }, 2000);
    };

    const handleSettingsTouchEnd = () => {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };


    return (
        <div className="canvas-container" ref={containerRef}>
            <div className="canvas-wrapper" style={{ cursor: 'crosshair', filter: settings.theme === 'dark' ? 'invert(1)' : 'none' }} onContextMenu={(e) => e.preventDefault()}>
                {/* We invert the container for dark mode to reuse light mode ink logic if desired, 
             but we handle color explicitly in code. Logic: simple CSS inversion is faster but less control.
             Let's use explicit colors. */}
                <canvas
                    ref={canvasRef}
                    onPointerDown={startStroke}
                    onPointerMove={moveStroke}
                    onPointerUp={endStroke}
                    onPointerOut={endStroke}
                    onPointerCancel={endStroke}
                />
            </div>

            {/* Hidden Settings Trigger Zone (Top Center) */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100px',
                    height: '50px',
                    zIndex: 10
                }}
                onPointerDown={handleSettingsTouchStart}
                onPointerUp={handleSettingsTouchEnd}
                onPointerLeave={handleSettingsTouchEnd}
                onContextMenu={(e) => e.preventDefault()}
            />

            {/* Settings Overlay */}
            {showSettings && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', color: '#fff',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    zIndex: 20
                }}>
                    <h2>Settings</h2>
                    <div style={{ margin: '20px' }}>
                        <label>Session: </label>
                        <button onClick={() => setSettings(s => ({ ...s, sessionLength: 15 }))}>15s</button>
                        <button onClick={() => setSettings(s => ({ ...s, sessionLength: 30 }))}>30s</button>
                        <button onClick={() => setSettings(s => ({ ...s, sessionLength: 60 }))}>60s</button>
                        <p>Current: {settings.sessionLength}s</p>
                    </div>
                    <div style={{ margin: '20px' }}>
                        <button onClick={() => setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))}>
                            Sound: {settings.soundEnabled ? 'ON' : 'OFF'}
                        </button>
                    </div>
                    <div style={{ margin: '20px' }}>
                        <button onClick={() => setSettings(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }))}>
                            Theme: {settings.theme}
                        </button>
                    </div>
                    <button onClick={() => setShowSettings(false)} style={{ marginTop: '20px', padding: '10px 20px' }}>Close</button>
                </div>
            )}

            <style jsx global>{`
         body {
             background: ${settings.theme === 'dark' ? '#0A0A0A' : '#FAFAFA'};
             color: ${settings.theme === 'dark' ? '#EDEDED' : '#171717'};
         }
       `}</style>
        </div>
    );
}

