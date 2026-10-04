"use client";

import { useEffect, useRef, useState } from "react";

const CLIPS = [
  "/videos/hero-garage.mp4",
  "/videos/hero-showroom.mp4",
  "/videos/hero-handover.mp4",
];

export function HeroReel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(media.matches);
    const onChange = () => setReduceMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || reduceMotion) return;
    node.load();
    const play = node.play();
    if (play) play.catch(() => undefined);
  }, [index, reduceMotion]);

  if (reduceMotion) {
    return (
      <img
        src="/images/hero.jpg"
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      key={CLIPS[index]}
      className="absolute inset-0 size-full object-cover"
      autoPlay
      muted
      playsInline
      preload="auto"
      poster="/images/hero.jpg"
      onEnded={() => setIndex((current) => (current + 1) % CLIPS.length)}
      aria-hidden="true"
    >
      <source src={CLIPS[index]} type="video/mp4" />
    </video>
  );
}