// Simple oscillator-based sound synthesizer for web
// "Extremely subtle... soft ink drag... faint texture noise"

let audioCtx: AudioContext | null = null;

function initAudio() {
    if (!audioCtx) {
        // @ts-ignore
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    return audioCtx;
}

export function playStrokeSound(speed: number, pressure: number) {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    // We want a continuous sound that modulates with speed.
    // Ideally this function is called once to start, and returns a controller interact with.
    // But for a simple "playStrokeSound" triggered frequently, it's better to have a persistent noise node.
}

class SoundEngine {
    ctx: AudioContext | null = null;
    noiseNode: AudioBufferSourceNode | null = null;
    gainNode: GainNode | null = null;
    filterNode: BiquadFilterNode | null = null;
    isPlaying: boolean = false;

    constructor() {
        if (typeof window !== 'undefined') {
            this.init();
        }
    }

    init() {
        // @ts-ignore
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            this.ctx = new AudioContextClass();
            this.createNoiseBuffer();
        }
    }

    createNoiseBuffer() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Pink noise approximation
        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            data[i] *= 0.11; // (roughly) compensate for gain
            b6 = white * 0.115926;
        }

        // We will recreate source nodes from this buffer
        this.noiseBuffer = buffer;
    }

    noiseBuffer: AudioBuffer | null = null;

    start() {
        if (!this.ctx || !this.noiseBuffer) return;
        if (this.isPlaying) return;

        if (this.ctx.state === 'suspended') this.ctx.resume();

        this.noiseNode = this.ctx.createBufferSource();
        this.noiseNode.buffer = this.noiseBuffer;
        this.noiseNode.loop = true;

        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.value = 0;

        this.filterNode = this.ctx.createBiquadFilter();
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.value = 400;

        this.noiseNode.connect(this.filterNode);
        this.filterNode.connect(this.gainNode);
        this.gainNode.connect(this.ctx.destination);

        this.noiseNode.start();
        this.isPlaying = true;
    }

    update(speed: number, pressure: number) {
        if (!this.isPlaying || !this.gainNode || !this.filterNode) return;

        // Map speed to volume and frequency
        // Speed 0 -> Volume 0
        // Speed High -> Volume 0.5

        const targetVol = Math.min(0.3, speed * 0.05);
        this.gainNode.gain.setTargetAtTime(targetVol, this.ctx!.currentTime, 0.1);

        const targetFreq = 200 + (speed * 100);
        this.filterNode.frequency.setTargetAtTime(targetFreq, this.ctx!.currentTime, 0.1);
    }

    stop() {
        if (this.noiseNode) {
            // Fade out?
            if (this.gainNode) {
                this.gainNode.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.2);
                setTimeout(() => {
                    if (this.noiseNode) {
                        try { this.noiseNode.stop(); } catch (e) { }
                        this.noiseNode = null;
                    }
                }, 250);
            } else {
                try { this.noiseNode.stop(); } catch (e) { }
            }
        }
        this.isPlaying = false;
    }
}

export const soundEngine = new SoundEngine();
