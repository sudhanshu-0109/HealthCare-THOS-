/**
 * components/common/WaveformBackground.jsx
 *
 * Full-page (left: 0, top: 0, right: 0, bottom: 0) Biometric Waveform Engine.
 * Shared across Physical Health, Mental Health, and the Health Hub.
 * Features multiple harmonic gradient waves, ambient luminous aurora fills,
 * subtle vital pulse beacons, and faint telemetry grid accents.
 * Ultra-smooth, tranquil, and visually stunning.
 */

import React, { useEffect, useRef } from "react";

export default function WaveformBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = null;
    let t = 0;
    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;

    // Glowing vital signal packets traveling along the primary wave
    const pulses = [
      { progress: 0.15, speed: 0.0006, size: 3.5, color: "rgba(52, 211, 153, 0.85)" },
      { progress: 0.52, speed: 0.0008, size: 4.2, color: "rgba(16, 185, 129, 0.90)" },
      { progress: 0.82, speed: 0.0005, size: 3.0, color: "rgba(110, 231, 183, 0.75)" },
    ];

    const handleResize = () => {
      dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const render = () => {
      if (width === 0 || height === 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Very slow, calming biometric speed
      const speed = 0.0014;
      const midY = height * 0.54;
      const baseAmp = Math.max(50, Math.min(height * 0.13, 105));
      const wavelength = Math.max(420, width * 0.42);

      // ── 1. Subtle Telemetry Grid Lines (Full Page) ──
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(16, 185, 129, 0.035)";
      ctx.setLineDash([4, 10]);

      [0.22, 0.38, 0.54, 0.70, 0.86].forEach(ratio => {
        const y = height * ratio;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      });
      ctx.setLineDash([]); // clear dash

      // Helper: Wave 1 (Primary Biometric Curve)
      const getWave1 = (x, time) => {
        const k1 = (x / wavelength) * Math.PI * 2 + time;
        const k2 = (x / (wavelength * 0.55)) * Math.PI * 2 - time * 0.7;
        const k3 = (x / (wavelength * 1.8)) * Math.PI * 2 + time * 0.3;
        return (
          midY +
          Math.sin(k1) * (baseAmp * 0.82) +
          Math.sin(k2) * (baseAmp * 0.26) +
          Math.cos(k3) * (baseAmp * 0.18)
        );
      };

      // Helper: Wave 2 (Harmonic Counter-Wave)
      const getWave2 = (x, time) => {
        const k1 = (x / (wavelength * 1.12)) * Math.PI * 2 - time * 0.85 + Math.PI * 0.65;
        const k2 = (x / (wavelength * 0.46)) * Math.PI * 2 + time * 0.5;
        return (
          midY +
          Math.sin(k1) * (baseAmp * 0.65) +
          Math.sin(k2) * (baseAmp * 0.22)
        );
      };

      // Helper: Wave 3 (Lower Ambient Horizon Wave)
      const getWave3 = (x, time) => {
        const k1 = (x / (wavelength * 1.45)) * Math.PI * 2 + time * 0.4 + Math.PI * 1.2;
        return (
          midY + height * 0.12 +
          Math.sin(k1) * (baseAmp * 0.55)
        );
      };

      // ── 2. Layer 1: Ambient Luminous Gradient Fill Below Wave 1 ──
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 6) {
        ctx.lineTo(x, getWave1(x, t));
      }
      ctx.lineTo(width, height);
      ctx.closePath();

      const auroraGrad = ctx.createLinearGradient(0, midY - baseAmp, 0, height);
      auroraGrad.addColorStop(0, "rgba(52, 211, 153, 0.055)");
      auroraGrad.addColorStop(0.35, "rgba(16, 185, 129, 0.035)");
      auroraGrad.addColorStop(0.75, "rgba(6, 78, 59, 0.012)");
      auroraGrad.addColorStop(1, "rgba(6, 78, 59, 0.00)");

      ctx.fillStyle = auroraGrad;
      ctx.fill();

      // ── 3. Layer 2: Deep Ambient Wave 3 (Soft Horizon) ──
      ctx.beginPath();
      for (let x = 0; x <= width; x += 6) {
        const y = getWave3(x, t);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const grad3 = ctx.createLinearGradient(0, 0, width, 0);
      grad3.addColorStop(0, "rgba(16, 185, 129, 0.03)");
      grad3.addColorStop(0.5, "rgba(52, 211, 153, 0.10)");
      grad3.addColorStop(1, "rgba(16, 185, 129, 0.03)");
      ctx.strokeStyle = grad3;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // ── 4. Layer 3: Secondary Counter-Wave 2 (Crests & Troughs) ──
      ctx.beginPath();
      for (let x = 0; x <= width; x += 4) {
        const y = getWave2(x, t);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const grad2 = ctx.createLinearGradient(0, 0, width, 0);
      grad2.addColorStop(0, "rgba(5, 150, 105, 0.04)");
      grad2.addColorStop(0.2, "rgba(16, 185, 129, 0.18)");
      grad2.addColorStop(0.5, "rgba(52, 211, 153, 0.22)");
      grad2.addColorStop(0.8, "rgba(16, 185, 129, 0.18)");
      grad2.addColorStop(1, "rgba(5, 150, 105, 0.04)");

      ctx.strokeStyle = grad2;
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // ── 5. Layer 4: Primary Biometric Waveform 1 (Glow + Sharp Line) ──
      ctx.save();
      ctx.shadowColor = "rgba(52, 211, 153, 0.35)";
      ctx.shadowBlur = 10;

      ctx.beginPath();
      for (let x = 0; x <= width; x += 4) {
        const y = getWave1(x, t);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      const grad1 = ctx.createLinearGradient(0, 0, width, 0);
      grad1.addColorStop(0, "rgba(6, 78, 59, 0.08)");
      grad1.addColorStop(0.18, "rgba(16, 185, 129, 0.32)");
      grad1.addColorStop(0.50, "rgba(52, 211, 153, 0.42)");
      grad1.addColorStop(0.82, "rgba(16, 185, 129, 0.32)");
      grad1.addColorStop(1, "rgba(6, 78, 59, 0.08)");

      ctx.strokeStyle = grad1;
      ctx.lineWidth = 2.8;
      ctx.stroke();
      ctx.restore();

      // ── 6. Subtle Vital Pulse Packets along Primary Wave ──
      pulses.forEach(p => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        const pulseX = p.progress * width;
        const pulseY = getWave1(pulseX, t);

        // Soft halo
        ctx.beginPath();
        ctx.arc(pulseX, pulseY, p.size * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(52, 211, 153, 0.12)";
        ctx.fill();

        // Inner glowing beacon
        ctx.beginPath();
        ctx.arc(pulseX, pulseY, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      t += speed;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
      }}
    />
  );
}
