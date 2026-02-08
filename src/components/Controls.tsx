"use client";

import { PASTEL_PALETTE, Palette } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
    Palette as PaletteIcon,
    RotateCcw,
    RotateCw,
    Trash2,
    Download,
    Sun,
    Minus,
    Plus
} from "lucide-react";
import { useState } from "react";

interface ControlsProps {
    segments: number;
    setSegments: (n: number) => void;
    color: string;
    setColor: (c: string) => void;
    brushSize: number;
    setBrushSize: (s: number) => void;
    onUndo: () => void;
    onRedo: () => void;
    onClear: () => void;
    onDownload: () => void;
    totalSegmentsOptions?: number[];
}

export default function Controls({
    segments,
    setSegments,
    color,
    setColor,
    brushSize,
    setBrushSize,
    onUndo,
    onRedo,
    onClear,
    onDownload,
    totalSegmentsOptions = [6, 8, 12, 16],
}: ControlsProps) {
    const [showPalette, setShowPalette] = useState(false);

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 p-4 rounded-2xl backdrop-blur-md bg-white/20 border border-white/30 shadow-xl transition-all animate-slide-up">

            {/* Undo/Redo */}
            <div className="flex gap-2 border-r border-white/20 pr-4">
                <button onClick={onUndo} className="p-2 hover:bg-white/20 rounded-full transition-colors" title="Undo">
                    <RotateCcw className="w-5 h-5 text-gray-800" />
                </button>
                <button onClick={onRedo} className="p-2 hover:bg-white/20 rounded-full transition-colors" title="Redo">
                    <RotateCw className="w-5 h-5 text-gray-800" />
                </button>
            </div>

            {/* Segments */}
            <div className="flex items-center gap-2 border-r border-white/20 pr-4">
                <Sun className="w-5 h-5 text-gray-800" />
                <div className="flex gap-1">
                    {totalSegmentsOptions.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => setSegments(opt)}
                            className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                                segments === opt
                                    ? "bg-white text-gray-900 shadow-md scale-110"
                                    : "bg-white/10 text-gray-700 hover:bg-white/30"
                            )}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>

            {/* Brush Size */}
            <div className="flex items-center gap-2 border-r border-white/20 pr-4">
                <div className="w-2 h-2 rounded-full bg-gray-800" />
                <input
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-24 h-1 bg-gray-400/50 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                />
                <div className="w-5 h-5 rounded-full bg-gray-800" />
            </div>

            {/* Color Picker */}
            <div className="relative">
                <button
                    onClick={() => setShowPalette(!showPalette)}
                    className="w-10 h-10 rounded-full border-2 border-white shadow-md transition-transform hover:scale-105 active:scale-95"
                    style={{ backgroundColor: color }}
                    title="Change Color"
                />

                {showPalette && (
                    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 p-3 grid grid-cols-3 gap-2 rounded-xl backdrop-blur-md bg-white/40 border border-white/30 shadow-xl">
                        {PASTEL_PALETTE.map((c) => (
                            <button
                                key={c}
                                onClick={() => { setColor(c); setShowPalette(false); }}
                                className="w-8 h-8 rounded-full border border-white/50 shadow-sm hover:scale-110 transition-transform"
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-l border-white/20 pl-4">
                <button onClick={onClear} className="p-2 hover:bg-red-500/20 text-red-600 rounded-full transition-colors" title="Clear Canvas">
                    <Trash2 className="w-5 h-5" />
                </button>
                <button onClick={onDownload} className="p-2 hover:bg-white/20 text-gray-800 rounded-full transition-colors" title="Save Image">
                    <Download className="w-5 h-5" />
                </button>
            </div>

        </div>
    );
}
