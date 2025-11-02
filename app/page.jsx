"use client";
import { useEffect, useMemo, useRef, useState } from "react";

function createClickSound(audioCtx) {
  const duration = 0.06;
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.5, audioCtx.currentTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  oscillator.connect(gain).connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}

function createLowClick(audioCtx) {
  const duration = 0.08;
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(160, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.6, audioCtx.currentTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  oscillator.connect(gain).connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}

export default function Page() {
  const [bpm, setBpm] = useState(110);
  const [isPlaying, setIsPlaying] = useState(false);
  const [steps, setSteps] = useState(() => Array(16).fill(false).map((_, i) => i % 4 === 0));
  const [accent, setAccent] = useState(() => Array(16).fill(false).map((_, i) => i % 8 === 0));
  const [stepIndex, setStepIndex] = useState(0);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  const snakes = useMemo(() => {
    return new Array(5).fill(0).map((_, i) => ({
      id: i,
      hue: Math.floor((i * 72) % 360),
      speed: 6 + i * 0.8,
      amplitude: 14 + i * 2,
    }));
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function togglePlay() {
    if (!audioRef.current) {
      audioRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (isPlaying) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsPlaying(false);
      return;
    }

    const sixteenthMs = (60_000 / bpm) / 4;
    let idx = stepIndex;
    setIsPlaying(true);

    timerRef.current = setInterval(() => {
      const at = idx;
      setStepIndex((prev) => at);
      const isAccent = accent[at];
      const shouldClick = steps[at];
      if (audioRef.current && (shouldClick || isAccent)) {
        if (isAccent && shouldClick) createLowClick(audioRef.current);
        else createClickSound(audioRef.current);
      }
      idx = (idx + 1) % 16;
    }, sixteenthMs);
  }

  function handleBpmChange(next) {
    setBpm(next);
    if (isPlaying) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsPlaying(false);
      // restart with new tempo
      setTimeout(() => togglePlay(), 10);
    }
  }

  function setStep(idx, value) {
    setSteps((prev) => prev.map((v, i) => (i === idx ? value : v)));
  }

  function setAccentStep(idx, value) {
    setAccent((prev) => prev.map((v, i) => (i === idx ? value : v)));
  }

  return (
    <main className="container">
      <header className="header">
        <h1>DJ Snakes</h1>
        <div className="controls">
          <button className="primary" onClick={togglePlay}>{isPlaying ? 'Stop' : 'Play'}</button>
          <label className="bpm">
            <span>BPM</span>
            <input
              type="range"
              min={60}
              max={180}
              value={bpm}
              onChange={(e) => handleBpmChange(Number(e.target.value))}
            />
            <strong>{bpm}</strong>
          </label>
        </div>
      </header>

      <section className="grid">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className={"cell " + (i === stepIndex ? 'active' : '')}>
            <label className="row">
              <input
                type="checkbox"
                checked={steps[i]}
                onChange={(e) => setStep(i, e.target.checked)}
              />
              <span>Step {i + 1}</span>
            </label>
            <label className="row sub">
              <input
                type="checkbox"
                checked={accent[i]}
                onChange={(e) => setAccentStep(i, e.target.checked)}
              />
              <span>Accent</span>
            </label>
          </div>
        ))}
      </section>

      <section className="stage">
        {snakes.map((s, idx) => (
          <Snake key={s.id} index={idx} hue={s.hue} speed={s.speed} amplitude={s.amplitude} stepIndex={stepIndex} />
        ))}
      </section>

      <footer className="footer">
        <span>Made with love for beats and noodles.</span>
      </footer>
    </main>
  );
}

function Snake({ index, hue, speed, amplitude, stepIndex }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const p = (stepIndex % 16) / 16;
    const offset = index * 24;
    el.style.setProperty('--h', String(hue));
    el.style.setProperty('--speed', `${speed}s`);
    el.style.setProperty('--amp', `${amplitude}px`);
    el.style.transform = `translateX(${p * 100}%) translateY(${Math.sin((p * Math.PI * 2) + index) * amplitude}px)`;
    el.style.filter = `hue-rotate(${(hue + p * 180) % 360}deg)`;
  }, [stepIndex, index, hue, speed, amplitude]);

  return (
    <div ref={ref} className="snake" aria-hidden>
      {Array.from({ length: 14 }).map((_, i) => (
        <span key={i} className="segment" style={{
          background: `hsl(${hue + i * 4} 80% 60%)`,
          boxShadow: `0 0 10px hsl(${(hue + i * 4) % 360} 90% 60% / 0.7)`
        }} />
      ))}
      <span className="eyes" />
    </div>
  );
}
