export interface Point {
    x: number;
    y: number;
}

export interface Stroke {
    points: Point[];
    color: string;
    size: number;
    segments: number;
    id: string;
}

export type Palette = string[];

export const PASTEL_PALETTE: Palette = [
    "#FFADAD", // pastel red
    "#FFD6A5", // pastel orange
    "#FDFFB6", // pastel yellow
    "#CAFFBF", // pastel green
    "#9BF6FF", // pastel cyan
    "#A0C4FF", // pastel blue
    "#BDB2FF", // pastel purple
    "#FFC6FF", // pastel pink
    "#FFFFFC", // almost white
];
