/**
 * pages/public/Landing.jsx
 *
 * 1:1 React port of healthcare_plus_landing_page.html.
 * Markup, copy, CSS declarations and responsive breakpoints are reproduced verbatim.
 *
 * Three deliberate adaptations, required to render identically inside this SPA:
 *   1. Every selector is scoped under `.landing-root` so the source's bare `body` /
 *      `*` / `h1` rules cannot leak onto the rest of the app.
 *   2. Icon rules target `svg` instead of `i` — the source used the lucide CDN, which
 *      swaps `<i data-lucide>` for an `<svg>` and therefore never matched its own
 *      `i { width/height/color }` rules. Targeting `svg` applies the intended design.
 *   3. Tailwind's preflight (loaded app-wide via index.css) resets `svg{display:block}`
 *      and `h2/h3{font-weight:inherit}`; those are restored to the UA defaults the
 *      source HTML rendered against.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  Menu,
  Hospital,
  Brain,
  Dumbbell,
  UserRound,
  LockKeyhole,
  FileSearch,
  ChartNoAxesCombined,
  Users,
  Activity,
  Building2,
  FlaskConical,
  Pill,
  Truck,
  UserCheck,
  Shield,
  Heart,
  X,
  Sparkles,
  ChevronRight,
  Stethoscope,
  Clock,
  Cpu,
  MapPin,
  Zap,
  CheckCircle,
} from 'lucide-react';

const LANDING_CSS = `
.landing-root {
  --navy:#142a47;
  --teal:#137f7b;
  --teal-dark:#0e6f6c;
  --mint:#e8f6f5;
  --soft:#f8fafb;
  --line:#dfe7e9;
  --muted:#617084;
  --purple:#6c48c7;
  --orange:#ef7a2c;
  --shadow:0 12px 32px rgba(25,55,73,.08);

  margin:0;
  color:var(--navy);
  background:#fff;
  font-family:"Manrope",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
}

.landing-root * { box-sizing:border-box; }
html:has(.landing-root) { scroll-behavior:smooth; }
.landing-root button,.landing-root a { font:inherit; }
.landing-root button { cursor:pointer; }

/* restore UA defaults flattened by Tailwind preflight */
.landing-root svg { display:inline-block; vertical-align:middle; }
.landing-root .hero-copy h2 { font-weight:700; }
.landing-root .section-intro h3 { font-weight:700; }

.landing-root .page {
  width:min(100%, 1680px);
  margin:auto;
  min-height:100vh;
  overflow:hidden;
  background:
    radial-gradient(circle at 72% 18%, rgba(195,236,233,.36), transparent 20%),
    linear-gradient(180deg,#ffffff 0%,#fbfcfc 100%);
}

.landing-root .nav {
  height:84px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 clamp(28px,4vw,68px);
  border-bottom:1px solid rgba(22,53,72,.07);
}
.landing-root .brand {
  display:flex;
  align-items:center;
  gap:11px;
  font-size:24px;
  font-weight:800;
  letter-spacing:-.7px;
}
.landing-root .brand-mark {
  width:39px;height:39px;border:2.5px solid var(--teal);border-radius:14px 14px 16px 16px;
  transform:rotate(45deg);position:relative;
}
.landing-root .brand-mark:before,.landing-root .brand-mark:after {
  content:"";position:absolute;background:var(--teal);left:50%;top:50%;transform:translate(-50%,-50%) rotate(-45deg);border-radius:4px;
}
.landing-root .brand-mark:before { width:17px;height:4px; }
.landing-root .brand-mark:after { width:4px;height:17px; }
.landing-root .nav-links { display:flex;align-items:center;gap:42px;margin-left:80px; }
.landing-root .nav-links a { color:#20354d;text-decoration:none;font-size:14px;font-weight:600;position:relative; }
.landing-root .nav-links a.active:after {
  content:"";position:absolute;left:0;right:0;bottom:-18px;height:2px;background:var(--teal);border-radius:99px;
}
.landing-root .nav-actions { display:flex;gap:12px; }
.landing-root .btn {
  min-height:46px;border-radius:9px;padding:0 27px;border:1px solid #c7d2d8;background:#fff;
  color:var(--navy);font-weight:700;font-size:14px;
}
.landing-root .btn.primary { background:linear-gradient(135deg,var(--teal),#138b87);color:white;border-color:transparent;box-shadow:0 9px 18px rgba(15,124,122,.18); }
.landing-root .mobile-menu { display:none;background:transparent;border:0;color:var(--navy); }

.landing-root .hero {
  max-width:1420px;
  margin:0 auto;
  padding:52px clamp(28px,4vw,68px) 34px;
  display:grid;
  grid-template-columns:minmax(430px,.92fr) minmax(540px,1.08fr);
  gap:36px;
  align-items:center;
}
.landing-root .hero-copy { padding-top:5px; }
.landing-root .eyebrow {
  display:inline-flex;align-items:center;gap:7px;background:#eef7f6;color:#2e7372;
  padding:7px 13px;border-radius:10px;font-size:12px;font-weight:700;margin-bottom:19px;
}
.landing-root .eyebrow svg { width:15px;height:15px; }
.landing-root h1 {
  margin:0;
  max-width:650px;
  font-size:clamp(44px,4.6vw,67px);
  line-height:1.14;
  letter-spacing:-2.6px;
  font-weight:800;
}
.landing-root h1 .accent { color:#217c79; }
.landing-root .hero-copy h2 {
  margin:14px 0 10px;font-size:28px;line-height:1.25;letter-spacing:-.9px;
}
.landing-root .hero-copy p {
  max-width:540px;color:#536173;font-size:15px;line-height:1.75;margin:0 0 20px;
}
.landing-root .hero-buttons { display:flex;gap:13px;align-items:center; }
.landing-root .hero-buttons .btn { min-width:170px; }
.landing-root .hero-buttons .btn svg { width:17px;vertical-align:middle;margin-left:8px; }
.landing-root .trust-row {
  margin-top:17px;display:flex;align-items:center;gap:11px;color:#566274;font-size:12px;font-weight:600;
}
.landing-root .trust-row svg { color:var(--teal);width:19px;height:19px; }
.landing-root .dot { width:4px;height:4px;background:var(--teal);border-radius:50%; }

.landing-root .hero-visual {
  height:470px;position:relative;display:flex;align-items:center;justify-content:center;
}
.landing-root .visual-orbit {
  position:absolute;width:440px;height:440px;border:1px dashed rgba(39,135,132,.32);border-radius:50%;
  pointer-events:none;
}
.landing-root .family-wrap {
  position:relative;width:380px;height:380px;display:flex;align-items:center;justify-content:center;
  overflow:hidden;border-radius:50%;
  box-shadow:0 16px 48px rgba(19,127,123,.14);
  border:4px solid #ffffff;
  background:#f8fafb;
}
.landing-root .family-wrap img {
  width:100%;height:100%;object-fit:cover;object-position:center;position:relative;z-index:1;
}
.landing-root .floating-card {
  position:absolute;background:rgba(255,255,255,.98);border:1px solid rgba(27,58,76,.08);border-radius:20px;
  padding:16px 18px;box-shadow:0 12px 32px rgba(29,54,70,.12);z-index:10;
  width:160px;min-height:120px;backdrop-filter:blur(8px);
}
.landing-root .floating-card svg { width:32px;height:32px;margin-bottom:6px; }
.landing-root .floating-card strong { display:block;font-size:14px;margin-bottom:4px;font-weight:800;color:var(--navy); }
.landing-root .floating-card span { font-size:11px;line-height:1.45;color:#566274;display:block; }
.landing-root .card-hospital { left:-10px;top:45px;text-align:center; }
.landing-root .card-hospital svg { color:#176f8c; }
.landing-root .card-mental { right:-10px;top:35px;text-align:center; }
.landing-root .card-mental svg { color:#4b9d7a; }
.landing-root .card-physical { right:15px;bottom:35px;text-align:center; }
.landing-root .card-physical svg { color:var(--orange); }
.landing-root .connected {
  position:absolute;z-index:12;bottom:6px;left:50%;transform:translateX(-50%);
  background:white;border-radius:99px;padding:12px 24px;box-shadow:0 12px 32px rgba(29,54,70,.14);
  display:flex;align-items:center;gap:10px;font-size:13px;font-weight:700;white-space:nowrap;
  border:1px solid rgba(27,58,76,.06);
}
.landing-root .connected svg { color:#4aa890;width:26px;height:26px; }

.landing-root .platform {
  max-width:1420px;margin:0 auto;padding:8px clamp(28px,4vw,68px) 36px;
}
.landing-root .section-intro { text-align:center;margin:2px 0 20px; }
.landing-root .section-intro .mini { color:#397a79;font-size:11px;letter-spacing:2px;font-weight:800; }
.landing-root .section-intro h3 { font-size:25px;margin:7px 0 4px;letter-spacing:-.7px; }
.landing-root .section-intro p { margin:0;color:#657285;font-size:13px; }

.landing-root .cards {
  display:grid;grid-template-columns:repeat(3,1fr);gap:20px;
}
.landing-root .service-card {
  min-height:250px;border-radius:22px;padding:22px 22px 18px;background:rgba(255,255,255,.84);
  border:1px solid rgba(25,55,73,.08);box-shadow:0 9px 26px rgba(28,54,72,.05);position:relative;overflow:hidden;
}
.landing-root .service-card:before {
  content:"";position:absolute;width:170px;height:170px;border-radius:50%;right:-70px;top:-75px;opacity:.35;
}
.landing-root .service-card.hospital:before { background:#dcecff; }
.landing-root .service-card.mental:before { background:#e3f6f0; }
.landing-root .service-card.physical:before { background:#fff0e7; }
.landing-root .service-top { display:flex;gap:16px;align-items:center;position:relative;z-index:1; }
.landing-root .service-icon {
  width:57px;height:57px;border-radius:50%;display:grid;place-items:center;flex:0 0 auto;
}
.landing-root .service-icon svg { width:30px;height:30px;color:#fff; }
.landing-root .hospital .service-icon { background:linear-gradient(135deg,#5d9cec,#3d74c9); }
.landing-root .mental .service-icon { background:linear-gradient(135deg,#42b98f,#3b8f75); }
.landing-root .physical .service-icon { background:linear-gradient(135deg,#ffae77,#ef7628); }
.landing-root .service-title { font-size:16px;font-weight:800;margin-bottom:5px; }
.landing-root .service-sub { font-size:12px;color:#596779;line-height:1.45; }
.landing-root .feature-list { list-style:none;padding:16px 0 0;margin:0;display:grid;gap:7px;position:relative;z-index:1; }
.landing-root .feature-list li { font-size:12px;color:#344257;display:flex;gap:8px;align-items:center; }
.landing-root .check {
  width:12px;height:12px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:8px;font-weight:800;
}
.landing-root .hospital .check { background:#4b7dc8; }
.landing-root .mental .check { background:#45a784; }
.landing-root .physical .check { background:#ed792d; }
.landing-root .card-arrow {
  position:absolute;right:18px;bottom:18px;width:43px;height:43px;border-radius:50%;border:1px solid #d7e0e4;
  background:white;color:var(--navy);display:grid;place-items:center;
}
.landing-root .card-arrow svg { width:20px;height:20px; }

.landing-root .benefits {
  margin-top:20px;border:1px solid rgba(25,55,73,.07);border-radius:22px;background:rgba(255,255,255,.7);
  display:grid;grid-template-columns:repeat(4,1fr);padding:13px 18px;box-shadow:0 8px 24px rgba(28,54,72,.04);
}
.landing-root .benefit {
  display:flex;align-items:center;gap:13px;padding:7px 16px;border-right:1px solid #e5eaec;
}
.landing-root .benefit:last-child { border-right:0; }
.landing-root .benefit-icon {
  width:47px;height:47px;border-radius:50%;display:grid;place-items:center;background:#edf8f7;color:#267d79;flex:0 0 auto;
}
.landing-root .benefit-icon svg { width:24px;height:24px; }
.landing-root .benefit strong { font-size:12px;display:block;margin-bottom:4px; }
.landing-root .benefit span { color:#647286;font-size:11px;line-height:1.45;display:block; }

@media (max-width:1050px) {
  .landing-root .nav-links { gap:22px;margin-left:20px; }
  .landing-root .hero { grid-template-columns:1fr 1fr;gap:20px; }
  .landing-root .hero-visual { transform:scale(.9);transform-origin:center; }
}

@media (max-width:760px) {
  .landing-root .page { min-width:0; }
  .landing-root .nav { height:76px;padding:0 24px; }
  .landing-root .brand { font-size:21px; }
  .landing-root .brand-mark { width:32px;height:32px;border-radius:12px; }
  .landing-root .nav-links,.landing-root .nav-actions { display:none; }
  .landing-root .mobile-menu { display:block; }
  .landing-root .mobile-menu svg { width:27px;height:27px; }

  .landing-root .hero {
    padding:28px 24px 20px;display:flex;flex-direction:column;align-items:stretch;gap:12px;
  }
  .landing-root .hero-copy { order:1;padding:0; }
  .landing-root .eyebrow { font-size:10px;padding:6px 10px;margin-bottom:14px; }
  .landing-root h1 { font-size:31px;line-height:1.15;letter-spacing:-1.2px;max-width:340px; }
  .landing-root .hero-copy h2 { font-size:15px;margin:9px 0 10px;letter-spacing:-.3px; }
  .landing-root .hero-copy p { font-size:12px;line-height:1.65;margin-bottom:16px; }
  .landing-root .hero-buttons { flex-direction:column;align-items:stretch;gap:10px; }
  .landing-root .hero-buttons .btn { width:100%;min-height:48px; }
  .landing-root .trust-row { justify-content:center;font-size:10px;margin-top:14px;gap:8px; }

  .landing-root .hero-visual {
    order:2;height:330px;width:100%;transform:none;margin-top:4px;
  }
  .landing-root .visual-orbit { width:245px;height:245px; }
  .landing-root .family-wrap { width:245px;height:295px;border-radius:46% 46% 12px 12px; }
  .landing-root .floating-card {
    width:105px;min-height:84px;padding:10px;border-radius:13px;
  }
  .landing-root .floating-card svg { width:23px;height:23px;margin-bottom:2px; }
  .landing-root .floating-card strong { font-size:9px;margin-bottom:2px; }
  .landing-root .floating-card span { font-size:7px;line-height:1.35; }
  .landing-root .card-hospital { left:0;top:45px; }
  .landing-root .card-mental { right:0;top:45px; }
  .landing-root .card-physical { right:5px;bottom:31px; }
  .landing-root .connected { bottom:2px;padding:9px 13px;border-radius:13px;font-size:9px;gap:7px; }
  .landing-root .connected svg { width:22px;height:22px; }

  .landing-root .platform { padding:5px 24px 28px; }
  .landing-root .section-intro { margin:3px 0 18px; }
  .landing-root .section-intro .mini { font-size:9px;letter-spacing:1.6px; }
  .landing-root .section-intro h3 { font-size:22px;line-height:1.25;margin:6px auto;max-width:330px; }
  .landing-root .section-intro p { font-size:11px;line-height:1.55; }

  .landing-root .cards { grid-template-columns:1fr;gap:15px; }
  .landing-root .service-card { min-height:205px;padding:18px 18px 15px;border-radius:18px; }
  .landing-root .service-top { gap:13px; }
  .landing-root .service-icon { width:52px;height:52px; }
  .landing-root .service-title { font-size:16px; }
  .landing-root .service-sub { font-size:11px; }
  .landing-root .feature-list { padding-top:13px;gap:6px; }
  .landing-root .feature-list li { font-size:11px; }
  .landing-root .card-arrow { width:40px;height:40px;right:15px;bottom:15px; }

  .landing-root .benefits { grid-template-columns:1fr 1fr;padding:8px 4px;border-radius:18px;gap:0;margin-top:16px; }
  .landing-root .benefit { padding:11px 12px;border-right:0; }
  .landing-root .benefit:nth-child(odd) { border-right:1px solid #e5eaec; }
  .landing-root .benefit-icon { width:38px;height:38px; }
  .landing-root .benefit-icon svg { width:20px;height:20px; }
  .landing-root .benefit strong { font-size:10px; }
  .landing-root .benefit span { font-size:9px; }
}

  /* Project Details & System Architecture */
  .landing-root .project-details-section {
    padding: 68px clamp(28px, 4vw, 68px);
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    border-top: 1px solid rgba(22, 53, 72, 0.08);
  }
  .landing-root .details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 24px;
    margin-top: 36px;
  }
  .landing-root .detail-card {
    background: #ffffff;
    border: 1px solid rgba(22, 53, 72, 0.08);
    border-radius: 20px;
    padding: 28px 24px;
    transition: all 0.25s ease;
    box-shadow: 0 4px 16px rgba(20, 42, 71, 0.03);
  }
  .landing-root .detail-card:hover {
    transform: translateY(-4px);
    border-color: rgba(19, 127, 123, 0.4);
    box-shadow: 0 14px 30px rgba(19, 127, 123, 0.09);
  }
  .landing-root .detail-icon {
    width: 50px;
    height: 50px;
    border-radius: 14px;
    background: var(--mint);
    color: var(--teal);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
  }
  .landing-root .detail-title {
    font-size: 18px;
    font-weight: 800;
    color: var(--navy);
    margin-bottom: 8px;
    letter-spacing: -0.3px;
  }
  .landing-root .detail-desc {
    font-size: 13px;
    color: var(--muted);
    line-height: 1.65;
  }
  .landing-root .stats-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-top: 48px;
    padding: 28px 36px;
    background: linear-gradient(135deg, #142a47 0%, #0d213a 100%);
    border-radius: 24px;
    color: #ffffff;
    box-shadow: 0 16px 36px rgba(20, 42, 71, 0.15);
  }
  .landing-root .stat-item {
    text-align: center;
  }
  .landing-root .stat-num {
    font-size: 34px;
    font-weight: 800;
    color: #2dd4bf;
    letter-spacing: -1px;
  }
  .landing-root .stat-label {
    font-size: 12px;
    color: #94a3b8;
    font-weight: 600;
    margin-top: 4px;
  }

  /* Minimal Premium Footer */
  .landing-root .minimal-footer {
    border-top: 1px solid rgba(22, 53, 72, 0.08);
    padding: 56px clamp(28px, 4vw, 68px) 32px;
    background: #ffffff;
  }
  .landing-root .footer-top {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 40px;
    margin-bottom: 44px;
  }
  .landing-root .footer-brand-col {
    max-width: 340px;
  }
  .landing-root .footer-brand-desc {
    font-size: 13px;
    color: var(--muted);
    line-height: 1.65;
    margin-top: 14px;
  }
  .landing-root .footer-links-grid {
    display: flex;
    gap: 56px;
    flex-wrap: wrap;
  }
  .landing-root .footer-col-title {
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--navy);
    margin-bottom: 16px;
  }
  .landing-root .footer-link-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .landing-root .footer-link-list a, .landing-root .footer-link-list button {
    font-size: 13px;
    color: var(--muted);
    text-decoration: none;
    transition: color 0.15s ease;
    background: none;
    border: none;
    padding: 0;
    text-align: left;
    cursor: pointer;
  }
  .landing-root .footer-link-list a:hover, .landing-root .footer-link-list button:hover {
    color: var(--teal);
  }
  .landing-root .footer-bottom {
    border-top: 1px solid rgba(22, 53, 72, 0.06);
    padding-top: 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    font-size: 12px;
    color: var(--muted);
  }
  .landing-root .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 99px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
    font-weight: 600;
    font-size: 11px;
  }

  /* How It Works Section */
  .landing-root .how-it-works-section {
    max-width: 1420px;
    margin: 0 auto;
    padding: 64px clamp(28px, 4vw, 68px) 72px;
    position: relative;
  }
  .landing-root .steps-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 22px;
    margin-top: 40px;
  }
  .landing-root .step-card {
    background: #ffffff;
    border: 1px solid rgba(25, 55, 73, 0.08);
    border-radius: 24px;
    padding: 26px 22px;
    box-shadow: 0 10px 30px rgba(25, 55, 73, 0.04);
    display: flex;
    flex-direction: column;
    position: relative;
    transition: all 0.3s ease;
  }
  .landing-root .step-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(19, 127, 123, 0.12);
    border-color: rgba(19, 127, 123, 0.3);
  }
  .landing-root .step-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }
  .landing-root .step-num-badge {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    background: var(--mint);
    color: var(--teal);
    font-weight: 800;
    font-size: 14px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(19, 127, 123, 0.15);
  }
  .landing-root .step-icon {
    width: 46px;
    height: 46px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #f0fdfa, #e6fffa);
    color: var(--teal);
    border: 1px solid rgba(19, 127, 123, 0.12);
  }
  .landing-root .step-icon svg {
    width: 22px;
    height: 22px;
  }
  .landing-root .step-title {
    font-size: 16px;
    font-weight: 800;
    color: var(--navy);
    margin-bottom: 8px;
    letter-spacing: -0.3px;
    line-height: 1.35;
  }
  .landing-root .step-desc {
    font-size: 12px;
    color: #596779;
    line-height: 1.65;
    margin-bottom: 18px;
    flex: 1;
  }
  .landing-root .step-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding-top: 14px;
    border-top: 1px solid rgba(22, 53, 72, 0.06);
  }
  .landing-root .step-tag {
    font-size: 10px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 99px;
    background: #f8fafc;
    color: #475569;
    border: 1px solid #e2e8f0;
  }

  .landing-root .how-cta-banner {
    margin-top: 48px;
    background: linear-gradient(135deg, var(--navy) 0%, #173859 100%);
    border-radius: 24px;
    padding: 34px clamp(24px, 4vw, 44px);
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 20px;
    box-shadow: 0 16px 40px rgba(20, 42, 71, 0.16);
  }
  .landing-root .how-cta-text h4 {
    font-size: 20px;
    font-weight: 800;
    margin: 0 0 6px;
    letter-spacing: -0.5px;
  }
  .landing-root .how-cta-text p {
    font-size: 13px;
    color: #94a3b8;
    margin: 0;
  }
  .landing-root .how-cta-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  @media (max-width: 1024px) {
    .landing-root .steps-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .landing-root .stats-strip {
      grid-template-columns: repeat(2, 1fr);
      padding: 20px;
    }
    .landing-root .footer-top {
      flex-direction: column;
      gap: 28px;
    }
    .landing-root .footer-links-grid {
      gap: 32px;
    }
    .landing-root .steps-grid {
      grid-template-columns: 1fr;
    }
    .landing-root .how-cta-banner {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}
`;

export default function Landing() {
  const navigate = useNavigate();

  // Anchor navigation without handing the fragment to the SPA router.
  const jump = (e, id) => {
    e.preventDefault();
    if (!id) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-root">
      <style>{LANDING_CSS}</style>

      <div className="page">

        <header className="nav">
          <div className="brand"><span className="brand-mark"></span><span>Healthcare+</span></div>

          <nav className="nav-links">
            <a href="#" className="active" onClick={(e) => jump(e)}>Home</a>
            <a href="#features" onClick={(e) => jump(e, 'features')}>Features</a>
            <a href="#how" onClick={(e) => jump(e, 'how')}>How It Works</a>
            <a href="#about" onClick={(e) => jump(e, 'about')}>About Us</a>
            <a href="#contact" onClick={(e) => jump(e, 'contact')}>Contact</a>
          </nav>

          <div className="nav-actions">
            <button className="btn" onClick={() => navigate('/login')}>Sign In</button>
            <button className="btn primary" onClick={() => navigate('/register')}>Sign Up</button>
          </div>

          <button className="mobile-menu" aria-label="Open menu"><Menu /></button>
        </header>

        <main>
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow"><ShieldCheck /> Your Health, Our Priority</div>

              <h1>
                Complete<br />
                HealthCare<br />
                <span className="accent">Operating System</span>
              </h1>

              <h2>One platform for everything.</h2>
              <p>Healthcare+ unifies healthcare, mental wellness and physical health into one intelligent platform to simplify care, improve outcomes and empower every life.</p>

              <div className="hero-buttons">
                <button className="btn primary" onClick={() => navigate('/register')}>Get Started <ArrowRight /></button>
                <button className="btn" onClick={() => navigate('/login')}>Sign In</button>
              </div>

              <div className="trust-row">
                <ShieldCheck />
                <span>Secure</span><span className="dot"></span>
                <span>Private</span><span className="dot"></span>
                <span>Trusted by thousands</span>
              </div>
            </div>

            <div className="hero-visual" aria-label="Healthcare family illustration">
              <div className="visual-orbit"></div>

              <div className="floating-card card-hospital">
                <Hospital />
                <strong>Hospital Care</strong>
                <span>Medical care made simple and accessible.</span>
              </div>

              <div className="floating-card card-mental">
                <Brain />
                <strong>Mental Wellness</strong>
                <span>Take care of your mind, every day.</span>
              </div>

              <div className="floating-card card-physical">
                <Dumbbell />
                <strong>Physical Health</strong>
                <span>Build healthy habits and stay active.</span>
              </div>

              <div className="family-wrap">
                <img src="/assets/family-sofa.jpg" alt="Family using Healthcare+" />
              </div>

              <div className="connected">
                <ShieldCheck />
                <span>One Platform.<br />Everything Connected.</span>
              </div>
            </div>
          </section>

          <section className="platform" id="features">
            <div className="section-intro">
              <div className="mini">ONE PLATFORM. TOTAL CARE.</div>
              <h3>Everything You Need. One Platform.</h3>
              <p>Healthcare+ brings all your healthcare needs together in one seamless experience.</p>
            </div>

            <div className="cards">

              <article className="service-card hospital">
                <div className="service-top">
                  <div className="service-icon"><Hospital /></div>
                  <div>
                    <div className="service-title">Hospital Care</div>
                    <div className="service-sub">Complete medical care at your fingertips.</div>
                  </div>
                </div>
                <ul className="feature-list">
                  <li><span className="check">✓</span>Book Appointments</li>
                  <li><span className="check">✓</span>Consult Doctors</li>
                  <li><span className="check">✓</span>Lab Tests &amp; Reports</li>
                  <li><span className="check">✓</span>Digital Prescriptions</li>
                  <li><span className="check">✓</span>Pharmacy &amp; Medicines</li>
                  <li><span className="check">✓</span>Emergency Support</li>
                  <li><span className="check">✓</span>Healthcare Passport</li>
                </ul>
                <button className="card-arrow"><ArrowRight /></button>
              </article>

              <article className="service-card mental">
                <div className="service-top">
                  <div className="service-icon"><Brain /></div>
                  <div>
                    <div className="service-title">Mental Wellness</div>
                    <div className="service-sub">AI-powered support for a healthier mind.</div>
                  </div>
                </div>
                <ul className="feature-list">
                  <li><span className="check">✓</span>AI Wellness Companion</li>
                  <li><span className="check">✓</span>Meditation &amp; Breathing</li>
                  <li><span className="check">✓</span>Sleep &amp; Relaxation</li>
                  <li><span className="check">✓</span>Mood Check-ins</li>
                  <li><span className="check">✓</span>Mindfulness Programs</li>
                  <li><span className="check">✓</span>Daily Wellness Plan</li>
                </ul>
                <button className="card-arrow"><ArrowRight /></button>
              </article>

              <article className="service-card physical">
                <div className="service-top">
                  <div className="service-icon"><Dumbbell /></div>
                  <div>
                    <div className="service-title">Physical Health</div>
                    <div className="service-sub">Personalized plans for a stronger you.</div>
                  </div>
                </div>
                <ul className="feature-list">
                  <li><span className="check">✓</span>Personalized Workouts</li>
                  <li><span className="check">✓</span>Exercise Guidance</li>
                  <li><span className="check">✓</span>Daily Fitness Plans</li>
                  <li><span className="check">✓</span>Hydration Tracking</li>
                  <li><span className="check">✓</span>Progress Tracking</li>
                </ul>
                <button className="card-arrow"><ArrowRight /></button>
              </article>

            </div>

            <div className="benefits">
              <div className="benefit">
                <div className="benefit-icon"><UserRound /></div>
                <div><strong>One Account</strong><span>One account to access all healthcare services.</span></div>
              </div>
              <div className="benefit">
                <div className="benefit-icon"><LockKeyhole /></div>
                <div><strong>Secure &amp; Private</strong><span>Your data is encrypted and always protected.</span></div>
              </div>
              <div className="benefit">
                <div className="benefit-icon"><FileSearch /></div>
                <div><strong>Seamless &amp; Connected</strong><span>All your health information connected in one place.</span></div>
              </div>
              <div className="benefit">
                <div className="benefit-icon"><ChartNoAxesCombined /></div>
                <div><strong>Better Every Day</strong><span>Track progress, build healthy habits, live a better life.</span></div>
              </div>
            </div>
          </section>

          {/* ── How It Works Section ── */}
          <section className="how-it-works-section" id="how">
            <div className="section-intro" style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
              <div className="mini">SIMPLE 4-STEP CARE LIFECYCLE</div>
              <h3>How HealthCare+ Works for You</h3>
              <p>
                From booking your first consultation to real-time emergency safety, experience a unified medical system engineered for speed, privacy, and simplicity.
              </p>
            </div>

            <div className="steps-grid">
              {/* Step 1 */}
              <div className="step-card">
                <div className="step-header">
                  <div className="step-num-badge">01</div>
                  <div className="step-icon"><ShieldCheck /></div>
                </div>
                <h4 className="step-title">Create Health Profile</h4>
                <p className="step-desc">
                  Sign up in seconds to get your encrypted HealthCare+ ID. Link your medical history, vitals, and emergency contacts into a tamper-proof digital passport.
                </p>
                <div className="step-tags">
                  <span className="step-tag">One-Click ABDM Signup</span>
                  <span className="step-tag">Encrypted Records</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="step-card">
                <div className="step-header">
                  <div className="step-num-badge">02</div>
                  <div className="step-icon"><Building2 /></div>
                </div>
                <h4 className="step-title">Select Hospital &amp; Doctor</h4>
                <p className="step-desc">
                  Browse nearby hospitals with live crowd status indicators. Filter verified specialists, check experience, and reserve in-person OPD or online video slots.
                </p>
                <div className="step-tags">
                  <span className="step-tag">Live Crowd Tracker</span>
                  <span className="step-tag">Instant Slot Booking</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="step-card">
                <div className="step-header">
                  <div className="step-num-badge">03</div>
                  <div className="step-icon"><Clock /></div>
                </div>
                <h4 className="step-title">Track Token &amp; Consult</h4>
                <p className="step-desc">
                  Follow your live token countdown from anywhere and skip waiting room delays. Consult seamlessly with top doctors and receive digital prescriptions instantly.
                </p>
                <div className="step-tags">
                  <span className="step-tag">Live Queue Token</span>
                  <span className="step-tag">Instant E-Prescriptions</span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="step-card">
                <div className="step-header">
                  <div className="step-num-badge">04</div>
                  <div className="step-icon"><Heart /></div>
                </div>
                <h4 className="step-title">Continuous Care &amp; SOS</h4>
                <p className="step-desc">
                  Automate lab reports, order prescribed medicines in 1 click, track wellness streaks, and stay covered with instant 1-tap Emergency GPS ambulance dispatch.
                </p>
                <div className="step-tags">
                  <span className="step-tag">1-Click Pharmacy</span>
                  <span className="step-tag">24/7 Geolocation SOS</span>
                </div>
              </div>
            </div>

            {/* Interactive Callout Banner */}
            <div className="how-cta-banner">
              <div className="how-cta-text">
                <h4>Ready to experience intelligent healthcare?</h4>
                <p>Join patients, clinics, and medical staff on the unified HealthCare+ Operating System.</p>
              </div>
              <div className="how-cta-actions">
                <button className="btn primary" onClick={() => navigate('/register')}>
                  Get Started Free <ArrowRight />
                </button>
                <button className="btn" onClick={() => navigate('/login')}>
                  Sign In
                </button>
              </div>
            </div>
          </section>

          {/* ── Project Details & System Architecture Section ── */}
          <section className="project-details-section" id="about">
            <div className="section-intro" style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
              <div className="mini">PROJECT OVERVIEW & ARCHITECTURE</div>
              <h3>Intelligent Healthcare Operating System</h3>
              <p>
                Healthcare+ is a next-generation unified medical platform connecting patients, clinical staff, emergency dispatchers, diagnostic labs, and hospital management into a single real-time ecosystem.
              </p>
            </div>

            <div className="details-grid">
              <div className="detail-card">
                <div className="detail-icon">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="detail-title">Live OPD Queue Engine</h4>
                <p className="detail-desc">
                  Eliminates waiting room crowding with live token generation, estimated consultation countdowns, desk check-in, and real-time status sync.
                </p>
              </div>

              <div className="detail-card">
                <div className="detail-icon">
                  <FileSearch className="w-6 h-6" />
                </div>
                <h4 className="detail-title">Universal Medical Passport</h4>
                <p className="detail-desc">
                  Encrypted digital medical record unifying consultation histories, diagnostic lab reports, e-prescriptions, and vital trends across care networks.
                </p>
              </div>

              <div className="detail-card">
                <div className="detail-icon">
                  <MapPin className="w-6 h-6" />
                </div>
                <h4 className="detail-title">Emergency Geolocation SOS</h4>
                <p className="detail-desc">
                  Instant 1-tap SOS trigger matching patients with nearby active drivers, live GPS vehicle tracking, and automated hospital arrival prep.
                </p>
              </div>

              <div className="detail-card">
                <div className="detail-icon">
                  <Cpu className="w-6 h-6" />
                </div>
                <h4 className="detail-title">8-Role Workspace Engine</h4>
                <p className="detail-desc">
                  Tailored operational dashboards for Patients, Doctors, Hospital Admins, Lab Technicians, Pharmacists, Drivers, Receptionists, and Super Admins.
                </p>
              </div>
            </div>

            {/* System Statistics Counter */}
            <div className="stats-strip">
              <div className="stat-item">
                <div className="stat-num">8</div>
                <div className="stat-label">Operational Workspaces</div>
              </div>
              <div className="stat-item">
                <div className="stat-num">100%</div>
                <div className="stat-label">Connected Workflows</div>
              </div>
              <div className="stat-item">
                <div className="stat-num">24/7</div>
                <div className="stat-label">Emergency SOS Dispatch</div>
              </div>
              <div className="stat-item">
                <div className="stat-num">0ms</div>
                <div className="stat-label">Standalone Latency</div>
              </div>
            </div>
          </section>
        </main>

        {/* ── Minimal Premium Footer ── */}
        <footer className="minimal-footer" id="contact">
          <div className="footer-top">
            <div className="footer-brand-col">
              <div className="brand">
                <span className="brand-mark"></span>
                <span>Healthcare+</span>
              </div>
              <p className="footer-brand-desc">
                The Complete Intelligent HealthCare Operating System. Streamlining OPD queues, emergency dispatch, diagnostics, and patient care across healthcare networks.
              </p>
            </div>

            <div className="footer-links-grid">
              <div>
                <div className="footer-col-title">Platform</div>
                <ul className="footer-link-list">
                  <li><a href="#" onClick={(e) => jump(e)}>Overview</a></li>
                  <li><a href="#features" onClick={(e) => jump(e, 'features')}>Features</a></li>
                  <li><a href="#about" onClick={(e) => jump(e, 'about')}>Architecture</a></li>
                  <li><a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Sign In</a></li>
                </ul>
              </div>

              <div>
                <div className="footer-col-title">Role Portals</div>
                <ul className="footer-link-list">
                  <li><a href="/login?role=PATIENT" onClick={(e) => { e.preventDefault(); navigate('/login?role=PATIENT'); }}>Patient Portal</a></li>
                  <li><a href="/login?role=DOCTOR" onClick={(e) => { e.preventDefault(); navigate('/login?role=DOCTOR'); }}>Doctor Portal</a></li>
                  <li><a href="/login?role=HOSPITAL_ADMIN" onClick={(e) => { e.preventDefault(); navigate('/login?role=HOSPITAL_ADMIN'); }}>Hospital Admin</a></li>
                  <li><a href="/login?role=LAB_STAFF" onClick={(e) => { e.preventDefault(); navigate('/login?role=LAB_STAFF'); }}>Lab Diagnostics</a></li>
                </ul>
              </div>

              <div>
                <div className="footer-col-title">Operations</div>
                <ul className="footer-link-list">
                  <li><a href="/login?role=PHARMACIST" onClick={(e) => { e.preventDefault(); navigate('/login?role=PHARMACIST'); }}>Pharmacy &amp; Rx</a></li>
                  <li><a href="/login?role=AMBULANCE_DRIVER" onClick={(e) => { e.preventDefault(); navigate('/login?role=AMBULANCE_DRIVER'); }}>Ambulance Dispatch</a></li>
                  <li><a href="/login?role=RECEPTIONIST" onClick={(e) => { e.preventDefault(); navigate('/login?role=RECEPTIONIST'); }}>Desk Check-in</a></li>
                  <li><a href="/login?role=SUPER_ADMIN" onClick={(e) => { e.preventDefault(); navigate('/login?role=SUPER_ADMIN'); }}>Super Admin</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div>
              © 2026 HealthCare+ OS. All rights reserved. Built for modern healthcare networks.
            </div>
            <div className="status-pill">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>100% Operational • Healthcare+ System</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
