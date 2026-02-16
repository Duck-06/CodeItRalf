export class AudioManager {
  constructor(settings) {
    this.settings = settings;
    this.sounds = {};
    this.punchTimeout = null; // Track punch sound timeout
  }

  load(name, path, loop = false) {
    const audio = new Audio(path);
    audio.loop = loop;
    this.sounds[name] = audio;
  }

  play(name) {
    const sound = this.sounds[name];
    if (!sound) return;

    // Set volume based on sound type
    if (name === 'bgm') {
      sound.volume = this.settings.musicVolume;
    } else {
      sound.volume = this.settings.sfxVolume;
    }

    // Reset sound to beginning
    sound.currentTime = 0;

    // Special handling for punch sound - shorten playback
    if (name === 'punch') {
      // Clear any existing punch timeout to prevent overlap
      if (this.punchTimeout) {
        clearTimeout(this.punchTimeout);
      }

      sound.play().catch(err => {
        console.log('Audio play prevented:', err.message);
      });

      // Stop punch sound after 120ms for crisp, tight sound
      this.punchTimeout = setTimeout(() => {
        sound.pause();
        sound.currentTime = 0;
      }, 120);
    } else {
      // Normal playback for BGM and win sound
      sound.play().catch(err => {
        console.log('Audio play prevented:', err.message);
      });
    }
  }

  pause(name) {
    const sound = this.sounds[name];
    if (!sound) return;
    sound.pause();
  }

  resume(name) {
    const sound = this.sounds[name];
    if (!sound) return;

    // Set volume (in case settings changed while paused)
    if (name === 'bgm') {
      sound.volume = this.settings.musicVolume;
    } else {
      sound.volume = this.settings.sfxVolume;
    }

    sound.play().catch(err => {
      console.log('Audio play prevented:', err.message);
    });
  }

  stop(name) {
    const sound = this.sounds[name];
    if (!sound) return;
    sound.pause();
    sound.currentTime = 0;
  }

  updateVolume(type, volume) {
    // Update volume for currently playing sounds
    // Note: Changing volume should NOT pause audio in any browser
    if (type === 'music' && this.sounds.bgm) {
      this.sounds.bgm.volume = volume;
    } else if (type === 'sfx') {
      // SFX volume will be applied on next play
      // Update punch sound if currently playing
      if (this.sounds.punch && !this.sounds.punch.paused) {
        this.sounds.punch.volume = volume;
      }
    }
  }

  stopAll() {
    for (const name in this.sounds) {
      this.stop(name);
    }
  }
}
