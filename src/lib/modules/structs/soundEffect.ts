import Resource from "./resource";

let defaultSettings = { 
    "attack": 3, 
    "hold": 100,
    "decay": 3,
    "freq": 440,
    "freqSlide": 0,
    "srate": 16000,
    "shape": 0,
    "slopes": 0,
    "crunch": 0,
    "subcrunch": 0,
}

let audioCtx: AudioContext;
let master: GainNode;


export type SoundEffectSettings = typeof defaultSettings;

export default class SoundEffect extends Resource {
    settings: SoundEffectSettings
    _buffer: AudioBuffer

    constructor(name: string) {
        super(name);

        this.settings = {
            attack: defaultSettings.attack,
            hold: defaultSettings.hold,
            decay: defaultSettings.decay,
            freq: defaultSettings.freq,
            freqSlide: defaultSettings.freqSlide,
            srate: defaultSettings.srate,
            shape: defaultSettings.shape,
            slopes: defaultSettings.slopes,
            crunch: defaultSettings.crunch,
            subcrunch: defaultSettings.subcrunch,
        };
    }

    
    static setMasterGain(gain) {
        if(!master) return;
        master.gain.setValueAtTime(gain, audioCtx.currentTime); // keep it civil!
    }

    static init() {
        audioCtx = new AudioContext();
        master = audioCtx.createGain();
        SoundEffect.setMasterGain(0.15);
        master.connect(audioCtx.destination);
    }

    createBuffer() {
        let settings = this.settings;
        let srate = settings.srate;
        let samples = (settings.attack + settings.decay + settings.hold) / 1000 * srate;
        let atk = Math.max(settings.attack, 0);
        let hold = Math.max(settings.hold, 0);
        let dec = Math.max(settings.decay, 0);
        let freq1 = settings.freq;
        let freq2 = settings.freq + settings.freqSlide;
        let buffer = audioCtx.createBuffer(1, samples, srate);
        let data = buffer.getChannelData(0);
        let env = 0;
        let preDistortion = settings.shape / 40;
        let slopesShape = settings.slopes / 40;
        
        for(let i = 0; i < samples; i++) {
            let t = i & ~(1<<settings.crunch>>1 | 1<<settings.subcrunch>>1);
            const prog = t/samples;
            const freq = freq1 * (1 - prog) + freq2 * (prog);
            const ms = t / (srate / 1000);
            env = ms <= atk? ms / atk : ms <= (atk+hold)? 1 : 1-(ms-hold-atk)/dec;
            env = Math.max(0, env);
            // env = 1
            let val = Math.sin(t / srate * 2 * Math.PI * freq);
            // distortion
            val = Math.sign(val) * Math.abs(val)**(1/(10**preDistortion));
            env = Math.sign(env) * Math.abs(env)**(1/(10**slopesShape));
            val *= env;
            data[t] = val;
        }

        this._buffer = buffer;
    }

    async play(gain: number = 1, detune: number = 0) {
        if(!this._buffer || !audioCtx) return;

        let source = audioCtx.createBufferSource();
        
        source.buffer = this._buffer;
        
        let gainNode = audioCtx.createGain();
        
        gainNode.gain.setValueAtTime(gain, audioCtx.currentTime);
        gainNode.connect(master);
        
        source.detune.setValueAtTime(detune*100, audioCtx.currentTime);

        source.connect(gainNode);
        source.start();

        await new Promise(resolve => source.onended = resolve); // wait for it to end
        source.disconnect();
        gainNode.disconnect();
    }
}