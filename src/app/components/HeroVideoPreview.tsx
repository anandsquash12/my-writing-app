"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const SCENES = [
  {
    title: "Write your thoughts…",
    subtitle: "Start with a clean page and a premium writing flow.",
    accent: "typing",
  },
  {
    title: "Poetry. Lyrics. Stories.",
    subtitle: "Showcase your best work in a beautiful reading layout.",
    accent: "lines",
  },
  {
    title: "Share it with the world",
    subtitle: "Publish public and premium posts from one dashboard.",
    accent: "compose",
  },
  {
    title: "Or lock it… and sell it",
    subtitle: "Choose personal or commercial rights for every premium post.",
    accent: "lock",
  },
  {
    title: "Earn from your words",
    subtitle: "Secure payments with Razorpay and real buyer trust.",
    accent: "payment",
  },
  {
    title: "Real people. Real earnings.",
    subtitle: "Notifications and sales updates keep you in control.",
    accent: "notifications",
  },
  {
    title: "Write. Share. Earn.",
    subtitle: "Start publishing premium writing on Writers Vault today.",
    accent: "final",
  },
];

const accentMap: Record<string, string> = {
  typing: "Typist",
  lines: "Verse",
  compose: "Create",
  lock: "Premium",
  payment: "Pay",
  notifications: "Notify",
  final: "Launch",
};

export default function HeroVideoPreview() {
  const [sceneIndex, setSceneIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSceneIndex((current) => (current + 1) % SCENES.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, []);

  const scene = SCENES[sceneIndex];
  const progress = useMemo(() => `${((sceneIndex + 1) / SCENES.length) * 100}%`, [sceneIndex]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_420px]">
      <div className="rounded-[32px] border border-white/10 bg-[#121218]/92 p-6 shadow-2xl">
        <div className="flex flex-col gap-4">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-[#a8997f]">Hero reel preview</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#f5efe2]">See the story behind the marketplace.</h2>
            <p className="mt-2 text-sm leading-7 text-[#d2c8b7]">A light video-style preview that explains writing, premium unlocks, and earnings without leaving the homepage.</p>
          </div>

          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#09090b] p-5 shadow-inner shadow-black/30">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-[#f0c18d] via-transparent to-transparent opacity-70" />
            <div className="relative mx-auto h-[560px] w-[312px] rounded-[42px] bg-[#101116] p-4 shadow-[0_30px_120px_-40px_rgba(0,0,0,0.65)] md:w-[320px]">
              <div className="h-full overflow-hidden rounded-[32px] border border-white/10 bg-[#09090b] px-4 py-5 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-[#7d7665]">
                  <span>Writers Vault</span>
                  <span>{sceneIndex + 1}/{SCENES.length}</span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={scene.title}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -24 }}
                    transition={{ duration: 0.55 }}
                    className="relative flex h-full flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="rounded-[26px] bg-white/3 p-4 shadow-[0_20px_80px_-40px_rgba(255,255,255,0.12)]">
                        <p className="text-sm uppercase tracking-[0.22em] text-[#d6b889]">Scene {sceneIndex + 1}</p>
                        <h3 className="mt-3 text-2xl font-semibold text-[#f5efe2]">{scene.title}</h3>
                        <p className="mt-3 text-sm leading-6 text-[#c9beaa]">{scene.subtitle}</p>
                      </div>

                      <div className="grid gap-3">
                        <div className="rounded-[26px] bg-[#0e0e12] p-4">
                          <p className="text-[10px] uppercase tracking-[0.28em] text-[#7c765e]">Preview</p>
                          <div className="mt-3 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-3xl bg-[#17171f] text-center leading-10 text-sm text-[#f5efe2]">{accentMap[scene.accent] || "Live"}</div>
                            <p className="text-sm text-[#d8cfbf]">Smooth, premium UI transitions with soft glow and focus layered on a dark canvas.</p>
                          </div>
                        </div>
                        <div className="rounded-[26px] bg-[#111117] p-4 text-sm text-[#bfb3a2]">
                          <p>Scene duration: <strong>{Math.round(4200 / 1000)}s</strong></p>
                          <p className="mt-1 text-[#a89f90]">Loop-friendly and center-safe for elegant website embedding.</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[24px] bg-white/5 p-3 text-xs text-[#d8cfbf]">
                      <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-[#aa9f8f]">
                        <span>Scene progress</span>
                        <span>{Math.round((sceneIndex / (SCENES.length - 1)) * 100)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#d6a56f] to-[#f0c18d] transition-all duration-500" style={{ width: progress }} />
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-white/10 bg-[#121218]/92 p-6 shadow-2xl">
        <p className="hero-tag">Hero preview</p>
        <h2 className="mt-4 text-3xl font-semibold text-[#f5efe2]">A website-friendly reel for your hero section</h2>
        <p className="mt-4 text-sm leading-7 text-[#d2c8b7]">
          This preview illustrates the premium writing marketplace with soft focus scenes and a calm dark visual style. Use it as a placeholder while you produce the final vertical hero video.
        </p>
        <div className="mt-6 grid gap-3 text-sm text-[#cfc2ad]">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <p className="font-semibold text-[#f5efe2]">Website safe</p>
            <p className="mt-2">Designed for center-safe embedding and a calm hero section without loud motion.</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <p className="font-semibold text-[#f5efe2]">Premium mood</p>
            <p className="mt-2">Dark aesthetic, serif styling, and focused copy for writers with earning potential.</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <p className="font-semibold text-[#f5efe2]">Easy to extend</p>
            <p className="mt-2">The same scene structure can be updated later with a real video or animated canvas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
