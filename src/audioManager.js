/**
 * TACTICAL ASSAULT - AUDIO MANAGER
 * Handles all game audio and sound effects
 */

const AudioManager = {
    audioContext: null,
    masterVolume: 0.7,
    sounds: {},
    musicVolume: 0.5,
    sfxVolume: 0.8,
    
    init() {
        this.masterVolume = Utils.loadSetting('masterVolume', 0.7);
        this.createAudioSources();
    },
    
    createAudioSources() {
        // Preload sound effect libraries
        this.sounds = {
            gunfire: { volume: 0.8, pitch: 1.0 },
            reload: { volume: 0.6, pitch: 1.0 },
            empty: { volume: 0.4, pitch: 1.2 },
            footstep: { volume: 0.3, pitch: 1.0 },
            jump: { volume: 0.5, pitch: 0.9 },
            land: { volume: 0.5, pitch: 0.8 },
            damage: { volume: 0.7, pitch: 1.0 },
            explosion: { volume: 0.9, pitch: 0.8 },
            pickup: { volume: 0.6, pitch: 1.3 },
            ui_click: { volume: 0.4, pitch: 1.0 },
            ui_hover: { volume: 0.3, pitch: 1.2 },
            alert: { volume: 0.7, pitch: 1.1 },
            headshot: { volume: 0.8, pitch: 1.4 }
        };
    },
    
    // Play sound using Web Audio API simulation with visual feedback
    play(soundName, position = null, volume = null) {
        if (!this.sounds[soundName]) return;
        
        const finalVolume = (volume || this.sounds[soundName].volume) * this.masterVolume * this.sfxVolume;
        
        // Create a beep-like sound to indicate audio playback
        if (finalVolume > 0) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                const now = audioContext.currentTime;
                const duration = 0.1;
                
                oscillator.frequency.value = 400;
                gainNode.gain.setValueAtTime(finalVolume * 0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
                
                oscillator.start(now);
                oscillator.stop(now + duration);
            } catch (e) {
                // AudioContext not supported
            }
        }
    },
    
    playAt(soundName, position) {
        this.play(soundName, position);
    },
    
    setVolume(volume) {
        this.masterVolume = Utils.clamp(volume, 0, 1);
        Utils.saveSetting('masterVolume', this.masterVolume);
    },
    
    getVolume() {
        return this.masterVolume;
    }
};
