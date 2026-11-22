import React, { useState, useEffect } from 'react';
import { Terminal, ChevronRight } from 'lucide-react';

export default function LaunchPage({ onLaunch }) {
  const [visible, setVisible]     = useState(false);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleLaunch = () => {
    setLaunching(true);
    setTimeout(onLaunch, 800);
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden flex items-center justify-center">

      {/* Background video */}
      <video
        autoPlay loop muted playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/f646741e9f.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay — slightly heavier so text pops over the circuit board */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-6"
        style={{
          opacity:    visible ? 1 : 0,
          transform:  visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.85s ease, transform 0.85s ease',
        }}
      >
        {/* Title */}
        <h1
          className="font-black tracking-tighter text-white leading-none mb-5 select-none"
          style={{
            fontSize:   'clamp(5rem, 14vw, 11rem)',
            fontFamily: '"Inter","Outfit",sans-serif',
          }}
        >
          KAI
          <span style={{
            backgroundImage: 'linear-gradient(135deg, #06b6d4, #38bdf8, #7dd3fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            ROS
          </span>
        </h1>

        {/* Description */}
        <p className="text-slate-300 text-base sm:text-lg max-w-lg leading-relaxed mb-10">
          Kernel-Aware Intelligent Resource Orchestration System — real-time OS telemetry,
          CPU scheduling simulation, deadlock avoidance, and ML-powered advisory.
        </p>

        {/* CTA */}
        <button
          onClick={handleLaunch}
          disabled={launching}
          className="group flex items-center gap-3 px-9 py-4 rounded-xl text-base font-bold text-white transition-all duration-300"
          style={{
            background:  launching
              ? 'rgba(6,182,212,0.6)'
              : 'linear-gradient(135deg, #0891b2, #06b6d4)',
            boxShadow:   launching ? 'none' : '0 0 36px rgba(6,182,212,0.5), 0 4px 16px rgba(6,182,212,0.3)',
            transform:   launching ? 'scale(0.97)' : 'scale(1)',
          }}
        >
          {launching ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Launching…
            </>
          ) : (
            <>
              <Terminal className="w-5 h-5" />
              Launch Dashboard
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>

      {/* Fade-to-black on launch */}
      <div
        className="absolute inset-0 bg-black pointer-events-none z-50"
        style={{ opacity: launching ? 1 : 0, transition: 'opacity 0.75s ease' }}
      />
    </div>
  );
}
