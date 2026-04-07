'use client'

/**
 * Hook "Yayyam Sound" - Sound Design 100% Coded
 * Joue l'arpège du succès sans aucun chargement de fichier MP3.
 */
export const useYayyamSound = () => {
  const playSuccess = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playNote = (frequency: number, startTime: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine'; // Sine pour un son très pur et rond (façon clochette / UI moderne)
          
          // Glissando très court pour donner un effet 'pop' à l'attaque de la note
          osc.frequency.setValueAtTime(frequency * 0.95, ctx.currentTime + startTime);
          osc.frequency.exponentialRampToValueAtTime(frequency, ctx.currentTime + startTime + 0.02);
          
          // Enveloppe de volume : Attaque ultra-rapide, Déclin long et élégant
          gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
          gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(ctx.currentTime + startTime);
          osc.stop(ctx.currentTime + startTime + duration);
      }
      
      // La signature sonore Yayyam : Accord Majeur Arpégé C5 -> E5 -> G5 -> C6
      // Le rythme est très rapide pour évoquer un succès instantané !
      playNote(523.25, 0.0, 0.4);   // C5
      playNote(659.25, 0.08, 0.4);  // E5
      playNote(783.99, 0.16, 0.4);  // G5
      playNote(1046.50, 0.24, 1.0); // C6 qui résonne !
      
    } catch (e) {
      console.error("Audio context non disponible ou bloqué", e)
    }
  }

  return { playSuccess }
}
