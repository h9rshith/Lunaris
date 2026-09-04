import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo, createContext, useContext } from "react";
import {
  Search,
  Menu,
  X,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Landmark,
  Wallet,
  BookOpen,
  Briefcase,
  Rocket,
  Code2,
  Home as HomeIcon,
  Users,
  Wheat,
  HeartPulse,
  FlaskConical,
  Mail,
  Globe,
  Sun,
  Moon,
  SlidersHorizontal,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  FileText,
  ClipboardList,
  Info,
  MapPin,
  CalendarClock,
  IndianRupee,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import opportunities, {
  CATEGORY_LIST,
  EDUCATION_LEVELS,
  APPLICANT_CATEGORIES,
  INDIAN_STATES,
} from "./data/opportunities";
import {
  matchOpportunities,
  searchOpportunities,
  formatIncome,
  formatAgeRange,
} from "./utils/matching";
import { askLunaris, MAX_CONTEXT_OPPORTUNITIES } from "./utils/featherless";

/* ------------------------------------------------------------------ */
/*  Tokens                                                             */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  Tokens — every value is a CSS custom property reference, so         */
/*  toggling [data-theme] on <html> instantly re-colors every place     */
/*  that reads from `tokens`, with zero per-component changes.          */
/*  See GlobalStyles() for the actual --color-* values per theme.       */
/* ------------------------------------------------------------------ */
const tokens = {
  voidBlack: "var(--color-bg)",
  deepSurface: "var(--color-bg-elevated)",
  midSurface: "var(--color-surface)",
  accentPrimary: "var(--color-primary)",
  textSecondary: "var(--color-secondary)",
  paleAccent: "var(--color-accent)",
  textPrimary: "var(--color-text)",
  textMuted: "var(--color-text-muted)",
  hairline: "var(--color-border)",
};

/* ------------------------------------------------------------------ */
/*  Navigation — lightweight state-based "router"                     */
/*  (no external router dependency; swap for react-router later if    */
/*  the project grows multiple real URLs)                             */
/* ------------------------------------------------------------------ */
const NavContext = createContext(null);

function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used within LunarisHomepage");
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Starfield palette — mirrors the CSS --color-* values above, since   */
/*  <canvas> can't resolve CSS custom properties directly.              */
/* ------------------------------------------------------------------ */
const STARFIELD_COLORS = {
  dark: {
    nebulaPrimary: "60,158,211", // cyan
    nebulaSecondary: "150,204,202", // mint
    constellation: "150,204,202", // mint
    starHalo: "216,227,242", // pale blue
    starCore: "255,255,255", // stars stay white/near-white in dark mode
    particle: "150,204,202",
    alphaMul: 1,
    coreAlphaMul: 1,
  },
  light: {
    nebulaPrimary: "60,158,211",
    nebulaSecondary: "150,204,202",
    constellation: "60,158,211",
    starHalo: "150,204,202",
    starCore: "20,45,58", // dark blue-black dots so they read on a light background
    particle: "60,158,211",
    alphaMul: 0.55,
    coreAlphaMul: 0.6,
  },
};

/* ------------------------------------------------------------------ */
/*  Global living starfield — one canvas, fixed behind the whole page  */
/* ------------------------------------------------------------------ */
function GlobalStarfield({ theme = "dark" }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // deterministic-ish pseudo random for variety
    const rand = (seed) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    const STAR_COUNT = Math.min(420, Math.floor((width * height) / 3400));
    const stars = Array.from({ length: STAR_COUNT }, (_, i) => {
      const r1 = rand(i * 12.9898);
      const r2 = rand(i * 78.233 + 3);
      const r3 = rand(i * 37.719 + 7);
      const r4 = rand(i * 91.345 + 11);
      const r5 = rand(i * 63.11 + 17);
      const layer = r3 < 0.5 ? 0 : r3 < 0.82 ? 1 : 2; // depth layers -> parallax + size
      return {
        x: r1 * width,
        y: r2 * height,
        layer,
        baseR: layer === 0 ? 0.5 + r4 * 0.5 : layer === 1 ? 0.9 + r4 * 0.8 : 1.5 + r4 * 1.3,
        baseAlpha: layer === 0 ? 0.25 + r4 * 0.25 : layer === 1 ? 0.4 + r4 * 0.3 : 0.6 + r4 * 0.35,
        twinkleSpeed: 0.3 + r4 * 0.9,
        phase: r2 * Math.PI * 2,
        driftX: (r1 - 0.5) * (layer === 0 ? 1.5 : layer === 1 ? 3 : 5),
        driftY: (r2 - 0.5) * (layer === 0 ? 1 : layer === 1 ? 2 : 3),
        // occasional brighter "glowing" flare cycle, mostly on bigger/brighter stars
        flareSpeed: 0.03 + r5 * 0.05,
        flarePhase: r5 * Math.PI * 2,
      };
    });

    // faint drifting particles
    const PARTICLE_COUNT = Math.min(56, Math.floor((width * height) / 30000));
    const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const r1 = rand(i * 51.13 + 91);
      const r2 = rand(i * 27.71 + 41);
      return {
        x: r1 * width,
        y: r2 * height,
        r: 1 + rand(i * 3.3) * 1.6,
        vx: (rand(i * 5.7) - 0.5) * 6,
        vy: -4 - rand(i * 9.1) * 8,
        alpha: 0.08 + rand(i * 4.4) * 0.1,
      };
    });

    // subtle constellation clusters — small groups of connected stars
    const constellations = [];
    for (let c = 0; c < 3; c++) {
      const cx = rand(c * 71 + 1) * width;
      const cy = rand(c * 33 + 2) * height * 0.6;
      const pts = Array.from({ length: 4 + Math.floor(rand(c * 19) * 2) }, (_, i) => ({
        x: cx + (rand(c * 13 + i * 7) - 0.5) * 160,
        y: cy + (rand(c * 21 + i * 5) - 0.5) * 120,
      }));
      constellations.push(pts);
    }

    let shootingStar = null;
    let nextShootAt = performance.now() + 2500 + Math.random() * 4000;

    let last = performance.now();

    const draw = (now) => {
      const dt = Math.min(64, now - last);
      last = now;
      ctx.clearRect(0, 0, width, height);

      const palette = STARFIELD_COLORS[themeRef.current] || STARFIELD_COLORS.dark;
      const am = palette.alphaMul;

      // nebula glows
      const g1 = ctx.createRadialGradient(width * 0.82, height * 0.06, 0, width * 0.82, height * 0.06, width * 0.5);
      g1.addColorStop(0, `rgba(${palette.nebulaPrimary},${(0.1 * am).toFixed(3)})`);
      g1.addColorStop(1, `rgba(${palette.nebulaPrimary},0)`);
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, width, height);

      const g2 = ctx.createRadialGradient(width * 0.12, height * 0.9, 0, width * 0.12, height * 0.9, width * 0.42);
      g2.addColorStop(0, `rgba(${palette.nebulaSecondary},${(0.07 * am).toFixed(3)})`);
      g2.addColorStop(1, `rgba(${palette.nebulaSecondary},0)`);
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);

      // constellation lines
      ctx.strokeStyle = `rgba(${palette.constellation},${(0.14 * am).toFixed(3)})`;
      ctx.lineWidth = 1;
      constellations.forEach((pts) => {
        ctx.beginPath();
        pts.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        pts.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${palette.constellation},${(0.5 * am).toFixed(3)})`;
          ctx.fill();
        });
      });

      // stars
      const t = now / 1000;
      stars.forEach((s) => {
        if (!reduceMotion) {
          s.x += (s.driftX * dt) / 16000;
          s.y += (s.driftY * dt) / 16000;
          if (s.x < -5) s.x = width + 5;
          if (s.x > width + 5) s.x = -5;
          if (s.y < -5) s.y = height + 5;
          if (s.y > height + 5) s.y = -5;
        }
        const twinkle = reduceMotion ? 1 : 0.65 + 0.35 * Math.sin(t * s.twinkleSpeed + s.phase);

        // rare bright flare burst, mostly on the closer/bigger star layer
        let flare = 0;
        if (!reduceMotion && s.layer === 2) {
          const cycle = (t * s.flareSpeed + s.flarePhase) % (Math.PI * 2);
          flare = Math.pow(Math.max(0, Math.sin(cycle)), 10) * 0.7;
        }

        // soft glow halo for bigger stars — cheap, cinematic depth
        if (s.baseR > 1.2) {
          const haloR = s.baseR * (flare > 0.05 ? 6 : 3.5);
          const halo = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, haloR);
          halo.addColorStop(0, `rgba(${palette.starHalo},${((0.14 * twinkle + flare * 0.25) * am).toFixed(3)})`);
          halo.addColorStop(1, `rgba(${palette.starHalo},0)`);
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(s.x, s.y, haloR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.baseR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${palette.starCore},${Math.min(1, (s.baseAlpha * twinkle + flare) * palette.coreAlphaMul).toFixed(3)})`;
        ctx.fill();
      });

      // drifting particles
      if (!reduceMotion) {
        particles.forEach((p) => {
          p.x += (p.vx * dt) / 1000;
          p.y += (p.vy * dt) / 1000;
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${palette.particle},${(p.alpha * am).toFixed(3)})`;
          ctx.fill();
        });
      }

      // shooting star
      if (!reduceMotion) {
        if (!shootingStar && now > nextShootAt) {
          shootingStar = {
            x: rand(now) * width * 0.6,
            y: rand(now * 1.3) * height * 0.4,
            vx: 380 + rand(now * 2) * 200,
            vy: 140 + rand(now * 3) * 100,
            life: 0,
            maxLife: 650,
          };
        }
        if (shootingStar) {
          shootingStar.life += dt;
          const progress = shootingStar.life / shootingStar.maxLife;
          const sx = shootingStar.x + (shootingStar.vx * shootingStar.life) / 1000;
          const sy = shootingStar.y + (shootingStar.vy * shootingStar.life) / 1000;
          const alpha = progress < 0.15 ? progress / 0.15 : 1 - (progress - 0.15) / 0.85;
          const grad = ctx.createLinearGradient(sx, sy, sx - 70, sy - 26);
          grad.addColorStop(0, `rgba(${palette.starCore},${Math.max(0, alpha)})`);
          grad.addColorStop(1, `rgba(${palette.starCore},0)`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx - 70, sy - 26);
          ctx.stroke();
          if (shootingStar.life >= shootingStar.maxLife) {
            shootingStar = null;
            nextShootAt = now + 4000 + Math.random() * 6000;
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="lunaris-global-canvas" aria-hidden="true" />;
}

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */
function CrescentMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14.5 2.3A9.7 9.7 0 1 0 21.7 14a7.6 7.6 0 0 1-7.2-11.7Z" fill="url(#lunarisCrescentGrad)" />
      <defs>
        <linearGradient id="lunarisCrescentGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop style={{ stopColor: "var(--color-accent)" }} />
          <stop offset="1" style={{ stopColor: "var(--color-primary)" }} />
        </linearGradient>
      </defs>
    </svg>
  );
}

function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ------------------------------------------------------------------ */
/*  Hero brand lockup — the premium Lunaris identity moment            */
/* ------------------------------------------------------------------ */
function LunarisBrandLockup() {
  return (
    <div className="lunaris-brand-lockup" aria-hidden="false">
      <div className="lunaris-brand-word-wrap">
        <span className="lunaris-brand-sparkle lunaris-brand-sparkle-1">✦</span>
        <span className="lunaris-brand-sparkle lunaris-brand-sparkle-2">·</span>
        <span className="lunaris-brand-sparkle lunaris-brand-sparkle-3">·</span>
        <span className="lunaris-brand-sparkle lunaris-brand-sparkle-4">✧</span>
        <p className="lunaris-brand-word">Lunaris</p>
      </div>
      <p className="lunaris-brand-tagline">One Stop Solution for all your problems.</p>
    </div>
  );
}

function PrimaryButton({ children, href = "#", onClick, className = "" }) {
  return (
    <a href={href} onClick={onClick} className={`lunaris-btn-primary inline-flex items-center gap-2 rounded-full px-6 py-3 font-medium ${className}`}>
      <span>{children}</span>
      <ArrowRight size={16} className="lunaris-btn-arrow" />
    </a>
  );
}

function SecondaryButton({ children, href = "#", onClick, className = "" }) {
  return (
    <a href={href} onClick={onClick} className={`lunaris-btn-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 font-medium ${className}`}>
      {children}
    </a>
  );
}

function GlassCard({ children, className = "", hover = true }) {
  return <div className={`lunaris-glass ${hover ? "lunaris-glass-hover" : ""} ${className}`}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/*  Navbar with floating glass menu panel                              */
/* ------------------------------------------------------------------ */
function Navbar() {
  const { navigate, theme, toggleTheme } = useNav();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 180);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && closeMenu();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeMenu]);

  const links = [
    { label: "Home", action: () => navigate("home") },
    { label: "Explore Opportunities", action: () => navigate("home", { scrollTo: "categories" }) },
    { label: "Scholarships", action: () => navigate("discovery", { filters: { category: "Scholarships" } }) },
    { label: "Government Schemes", action: () => navigate("discovery", { filters: { category: "Government Schemes" } }) },
    { label: "How It Works", action: () => navigate("home", { scrollTo: "how-it-works" }) },
  ];

  return (
    <header className={`lunaris-navbar ${scrolled ? "lunaris-navbar-scrolled" : ""}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <a
          href="#"
          className="flex items-center gap-2"
          onClick={(e) => {
            e.preventDefault();
            navigate("home");
          }}
        >
          <CrescentMark />
          <span className="text-lg font-semibold tracking-tight" style={{ color: tokens.textPrimary }}>
            Lunaris
          </span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href="#"
              className="lunaris-nav-link text-sm"
              onClick={(e) => {
                e.preventDefault();
                l.action();
              }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <button aria-label="Search" className="lunaris-icon-btn">
            <Search size={17} />
          </button>
          <button aria-label="Change language" className="lunaris-icon-btn">
            <Globe size={17} />
          </button>
          <button
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="lunaris-icon-btn"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <a href="#" className="lunaris-signin rounded-full px-5 py-2 text-sm font-medium">
            Sign In
          </a>
        </div>

        <button
          className="lunaris-icon-btn lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => (open ? closeMenu() : setOpen(true))}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <>
          <div
            className={`lunaris-menu-backdrop ${closing ? "lunaris-menu-backdrop-out" : "lunaris-menu-backdrop-in"}`}
            onClick={closeMenu}
          />
          <div
            ref={panelRef}
            className={`lunaris-menu-panel ${closing ? "lunaris-menu-panel-out" : "lunaris-menu-panel-in"}`}
          >
            <div className="flex items-center gap-2 px-5 pt-5">
              <CrescentMark size={18} />
              <span className="text-sm font-semibold" style={{ color: tokens.textPrimary }}>
                Lunaris
              </span>
            </div>
            <nav className="flex flex-col gap-1 px-3 pt-4">
              {links.map((l) => (
                <a
                  key={l.label}
                  href="#"
                  className="lunaris-nav-link-panel"
                  onClick={(e) => {
                    e.preventDefault();
                    l.action();
                    closeMenu();
                  }}
                >
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="lunaris-menu-divider" />
            <div className="px-5 pt-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="lunaris-mobile-theme-toggle flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              </button>
            </div>
            <div className="px-5 pb-5 pt-3">
              <a href="#" className="lunaris-signin flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium">
                Sign In <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </>
      )}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero + Search                                                      */
/* ------------------------------------------------------------------ */
function Hero() {
  const { navigate } = useNav();
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    navigate("discovery", { query });
  };

  return (
    <section className="lunaris-hero relative overflow-hidden">
      <div className="lunaris-moon" aria-hidden="true" />
      <svg className="lunaris-constellation" viewBox="0 0 800 500" aria-hidden="true">
        <line x1="620" y1="90" x2="700" y2="150" />
        <line x1="700" y1="150" x2="660" y2="230" />
        <line x1="660" y1="230" x2="740" y2="260" />
        <circle cx="620" cy="90" r="2" />
        <circle cx="700" cy="150" r="2" />
        <circle cx="660" cy="230" r="2" />
        <circle cx="740" cy="260" r="2" />
      </svg>

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-5 pb-24 pt-28 text-center md:pt-36">
        <LunarisBrandLockup />
        <h1 className="lunaris-hero-heading mt-10 text-4xl leading-[1.1] md:text-6xl">
          Discover What&rsquo;s Meant for You.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed md:text-lg" style={{ color: tokens.textSecondary }}>
          Scholarships, government schemes, financial aid, fellowships, internships and opportunities — all in one place.
        </p>
        <p className="mt-3 text-sm font-medium tracking-wide" style={{ color: tokens.textMuted }}>
          One platform. Thousands of opportunities. Built for India.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <PrimaryButton
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("discovery");
            }}
          >
            Find Opportunities
          </PrimaryButton>
          <SecondaryButton
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("discovery", { filters: { category: "Government Schemes" } });
            }}
          >
            Explore Schemes
          </SecondaryButton>
        </div>

        <div className="mt-14 w-full max-w-2xl">
          <form className="lunaris-search" onSubmit={handleSearch}>
            <Search size={18} className="shrink-0" style={{ color: tokens.textMuted }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search scholarships, schemes, fellowships, internships..."
              className="lunaris-search-input"
            />
            <button type="submit" className="lunaris-search-btn">
              Search
            </button>
          </form>
          <p className="mt-4 text-sm" style={{ color: tokens.textMuted }}>
            Not sure what you&rsquo;re eligible for?{" "}
            <a
              href="#"
              className="lunaris-view-link font-medium"
              onClick={(e) => {
                e.preventDefault();
                navigate("personalized");
              }}
            >
              Let Lunaris help you find out.
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats / Trust                                                      */
/* ------------------------------------------------------------------ */
function Stats() {
  const stats = [
    { icon: GraduationCap, value: "Thousands+", label: "Scholarships & Schemes" },
    { icon: Landmark, value: "Multiple", label: "Opportunity Categories" },
    { icon: Globe, value: "Pan-India", label: "Coverage" },
    { icon: Rocket, value: "One", label: "Personalized Discovery Platform" },
  ];
  return (
    <section className="lunaris-section-stats relative px-5 py-24 md:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="lunaris-heading text-center text-3xl md:text-4xl">A Universe of Opportunities, One Place</h2>
        <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {stats.map((s) => (
            <GlassCard key={s.label} className="flex flex-col items-center gap-3 px-4 py-8 text-center">
              <div className="lunaris-stat-icon">
                <s.icon size={20} />
              </div>
              <span className="text-2xl font-semibold md:text-3xl" style={{ color: tokens.textPrimary }}>
                {s.value}
              </span>
              <span className="text-sm" style={{ color: tokens.textMuted }}>
                {s.label}
              </span>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Categories — compact grid                                          */
/* ------------------------------------------------------------------ */
function Categories() {
  const { navigate } = useNav();
  const categories = [
    { icon: GraduationCap, name: "Scholarships", color: "#BFD9F0" },
    { icon: Landmark, name: "Government Schemes", color: "#8FA6F0" },
    { icon: Wallet, name: "Financial Assistance", color: "#E8C77E" },
    { icon: BookOpen, name: "Education", color: "#7FD8E0" },
    { icon: Briefcase, name: "Internships", color: "#E8B08C" },
    { icon: Rocket, name: "Fellowships", color: "#E39BD6" },
    { icon: Code2, name: "Skills & Employment", color: "#F0B26B" },
    { icon: HomeIcon, name: "Welfare & Housing", color: "#7FDCC4" },
    { icon: Users, name: "Women & Child Welfare", color: "#F2B6C6" },
    { icon: Wheat, name: "Agriculture & Rural", color: "#93D48A" },
    { icon: HeartPulse, name: "Health & Wellness", color: "#F08CA0" },
    { icon: FlaskConical, name: "Science & Technology", color: "#8FD0F0" },
  ];

  return (
    <section id="categories" className="lunaris-section-categories relative px-5 py-24 md:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="lunaris-heading text-center text-3xl md:text-4xl">Explore by Category</h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm md:text-base" style={{ color: tokens.textMuted }}>
          Find opportunities organized the way you already think about them.
        </p>
        <div className="lunaris-cat-grid mt-14">
          {categories.map((c) => (
            <a
              href="#"
              key={c.name}
              className="lunaris-cat-item"
              onClick={(e) => {
                e.preventDefault();
                navigate("discovery", { filters: { category: c.name } });
              }}
              style={{
                "--cat-color": c.color,
                "--cat-bg": hexToRgba(c.color, 0.16),
                "--cat-border": hexToRgba(c.color, 0.32),
                "--cat-glow": hexToRgba(c.color, 0.5),
              }}
            >
              <span className="lunaris-cat-item-icon">
                <c.icon size={22} />
              </span>
              <span className="lunaris-cat-item-name">{c.name}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Personalized Discovery                                             */
/* ------------------------------------------------------------------ */
function PersonalizedDiscovery() {
  const { navigate } = useNav();
  const attributes = ["Education", "Age", "State", "Category", "Family Income", "Gender", "Disability Status", "Interests"];
  return (
    <section className="lunaris-section-personalized relative overflow-hidden px-5 py-24 md:px-8">
      <div className="lunaris-radial-glow" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl text-center">
        <h2 className="lunaris-heading text-3xl md:text-4xl">Don&rsquo;t Know Where to Start?</h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed" style={{ color: tokens.textSecondary }}>
          Tell Lunaris a little about yourself, and discover scholarships, schemes and opportunities that may be relevant to you.
        </p>
        <div className="mt-9">
          <PrimaryButton
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("personalized");
            }}
          >
            Find Opportunities For Me
          </PrimaryButton>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
          {attributes.map((a) => (
            <span key={a} className="lunaris-pill">
              {a}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  How It Works                                                       */
/* ------------------------------------------------------------------ */
function HowItWorks() {
  const steps = [
    { n: "01", title: "Tell Us About You", desc: "Share a few basic details." },
    { n: "02", title: "Discover", desc: "Lunaris finds relevant opportunities." },
    { n: "03", title: "Compare", desc: "Understand eligibility, benefits and requirements." },
    { n: "04", title: "Apply", desc: "Go directly to the official application source." },
  ];
  return (
    <section id="how-it-works" className="lunaris-section-how relative px-5 py-24 md:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="lunaris-heading text-center text-3xl md:text-4xl">Your Journey Starts Here</h2>
        <div className="lunaris-steps mt-16">
          {steps.map((s, i) => (
            <div key={s.n} className="lunaris-step">
              <div className="lunaris-step-num">{s.n}</div>
              <h3 className="mt-5 text-base font-medium" style={{ color: tokens.textPrimary }}>
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: tokens.textMuted }}>
                {s.desc}
              </p>
              {i < steps.length - 1 && <span className="lunaris-step-line" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Featured Opportunities                                             */
/* ------------------------------------------------------------------ */
const FEATURED_IDS = [
  "scheme-002", // Central Sector Scheme of Scholarship
  "scheme-018", // PM Vishwakarma Yojana
  "scheme-038", // PMKVY
  "scheme-020", // Stand-Up India
  "scheme-047", // Beti Bachao Beti Padhao
  "scheme-033", // PMRF
];

function eligibilitySummary(opp) {
  const elig = opp.eligibility || {};
  const bits = [];
  if (elig.education?.length && !elig.education.includes("Any")) bits.push(elig.education.join("/"));
  if (elig.gender && elig.gender !== "All") bits.push(elig.gender);
  if (elig.category?.length && elig.category.length <= 3) bits.push(elig.category.join("/"));
  if (!bits.length) bits.push("Open to eligible citizens");
  return bits.join(" · ");
}

function FeaturedOpportunities() {
  const { navigate } = useNav();
  const items = FEATURED_IDS.map((id) => opportunities.find((o) => o.id === id)).filter(Boolean);

  return (
    <section id="featured" className="lunaris-section-featured relative px-5 py-24 md:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="lunaris-heading text-center text-3xl md:text-4xl">Opportunities Worth Exploring</h2>
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <GlassCard key={it.id} className="flex flex-col px-6 py-6">
              <span className="lunaris-tag self-start">{it.category}</span>
              <h3 className="mt-4 text-base font-medium leading-snug" style={{ color: tokens.textPrimary }}>
                {it.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: tokens.textMuted }}>
                {it.description}
              </p>
              <p className="mt-3 text-xs" style={{ color: tokens.textSecondary }}>
                Eligibility: {eligibilitySummary(it)}
              </p>
              <a
                href="#"
                className="lunaris-view-link mt-5 inline-flex items-center gap-1.5 text-sm font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("details", { id: it.id });
                }}
              >
                View Details <ArrowRight size={14} />
              </a>
            </GlassCard>
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <SecondaryButton
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("discovery");
            }}
          >
            Browse All Opportunities
          </SecondaryButton>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Why Lunaris                                                        */
/* ------------------------------------------------------------------ */
function WhyLunaris() {
  return (
    <section className="lunaris-section-why relative overflow-hidden px-5 py-24 md:px-8">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
        <div>
          <h2 className="lunaris-heading text-3xl md:text-4xl">
            Opportunities Exist. Finding Them Shouldn&rsquo;t Be Hard.
          </h2>
          <p className="mt-6 text-base leading-relaxed" style={{ color: tokens.textSecondary }}>
            India has thousands of scholarships, government schemes and opportunities designed to support its citizens. But discovering the right one can be difficult when information is scattered across different platforms.
          </p>
          <p className="mt-4 text-base font-medium" style={{ color: tokens.textPrimary }}>
            Lunaris brings opportunity discovery into one simple place.
          </p>
        </div>
        <div className="relative flex items-center justify-center">
          <OrbitDiagram />
        </div>
      </div>
    </section>
  );
}

function OrbitDiagram() {
  const nodes = [
    { label: "Scholarships", angle: -90 },
    { label: "Schemes", angle: -30 },
    { label: "Internships", angle: 30 },
    { label: "Fellowships", angle: 90 },
    { label: "Welfare", angle: 150 },
    { label: "Skills", angle: 210 },
  ];
  const radius = 140;
  const ambientStars = Array.from({ length: 14 }, (_, i) => {
    const rand = (seed) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    return {
      top: rand(i * 12.9) * 100,
      left: rand(i * 47.3 + 5) * 100,
      delay: (i % 5) * 0.6,
    };
  });

  return (
    <div className="lunaris-orbit-wrap">
      <div className="lunaris-orbit-field" aria-hidden="true">
        {ambientStars.map((s, i) => (
          <span
            key={i}
            className="lunaris-orbit-star"
            style={{ top: `${s.top}%`, left: `${s.left}%`, animationDelay: `${s.delay}s` }}
          />
        ))}
      </div>
      <div className="lunaris-orbit-ring lunaris-orbit-ring-outer" />
      <div className="lunaris-orbit-ring lunaris-orbit-ring-inner" />
      <div className="lunaris-moon-orb">
        <span className="lunaris-moon-orb-glow" aria-hidden="true" />
        <span className="lunaris-moon-crater lunaris-moon-crater-1" aria-hidden="true" />
        <span className="lunaris-moon-crater lunaris-moon-crater-2" aria-hidden="true" />
        <span className="lunaris-moon-crater lunaris-moon-crater-3" aria-hidden="true" />
        <CrescentMark size={28} />
      </div>
      {nodes.map((n, i) => {
        const rad = (n.angle * Math.PI) / 180;
        const x = radius * Math.cos(rad);
        const y = radius * Math.sin(rad);
        return (
          <div key={n.label} className="lunaris-orbit-node-pos" style={{ transform: `translate(${x}px, ${y}px)` }}>
            <span className="lunaris-orbit-node" style={{ animationDelay: `${i * 0.4}s` }}>
              {n.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Final CTA                                                          */
/* ------------------------------------------------------------------ */
function FinalCTA() {
  return (
    <section className="lunaris-final-cta relative overflow-hidden px-5 py-28 text-center md:px-8">
      <div className="relative z-10 mx-auto max-w-2xl">
        <h2 className="lunaris-heading text-3xl md:text-4xl">
          Your Next Opportunity Could Be Closer Than You Think.
        </h2>
        <p className="mt-5 text-base leading-relaxed" style={{ color: tokens.textSecondary }}>
          Explore scholarships, schemes and opportunities built to help you move forward.
        </p>
        <div className="mt-9 flex justify-center">
          <PrimaryButton href="#categories">Start Exploring</PrimaryButton>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer — multi-column                                              */
/* ------------------------------------------------------------------ */
const FOOTER_QUICK_LINKS = {
  Home: (navigate) => navigate("home"),
  Explore: (navigate) => navigate("discovery"),
  Scholarships: (navigate) => navigate("discovery", { filters: { category: "Scholarships" } }),
  "Government Schemes": (navigate) => navigate("discovery", { filters: { category: "Government Schemes" } }),
  "How It Works": (navigate) => navigate("home", { scrollTo: "how-it-works" }),
};

const FOOTER_CATEGORY_LINKS = ["Scholarships", "Education", "Government Schemes", "Internships", "Fellowships", "Skills & Employment"];

function Footer() {
  const { navigate } = useNav();
  const emails = [
    "hansikaperumandla02@gmail.com",
    "nidhibhalkikar02@gmail.com",
    "jathinreddy1501g@gmail.com",
    "subrahmanya2111@gmail.com",
    "harshithr4m@gmail.com",
  ];
  return (
    <footer className="lunaris-footer relative px-5 pb-8 pt-16 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="lunaris-footer-grid">
          <div>
            <div className="flex items-center gap-2">
              <CrescentMark />
              <span className="text-lg font-semibold" style={{ color: tokens.textPrimary }}>
                Lunaris
              </span>
            </div>
            <p className="mt-3 text-sm" style={{ color: tokens.textMuted }}>
              One place. Every opportunity.
            </p>
            <p className="mt-6 text-xs uppercase tracking-wide" style={{ color: tokens.textMuted }}>
              Powered by
            </p>
            <p className="mt-1 text-sm font-medium" style={{ color: tokens.textSecondary }}>
              NGIT
            </p>
            <p className="text-xs" style={{ color: tokens.textMuted }}>
              Neil Gogte Institute of Technology
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
              Quick Links
            </h4>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              {Object.keys(FOOTER_QUICK_LINKS).map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="lunaris-footer-link"
                    onClick={(e) => {
                      e.preventDefault();
                      FOOTER_QUICK_LINKS[l](navigate);
                    }}
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
              Categories
            </h4>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              {FOOTER_CATEGORY_LINKS.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="lunaris-footer-link"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("discovery", { filters: { category: l } });
                    }}
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
              Get in Touch
            </h4>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              {emails.map((e) => (
                <li key={e} className="flex items-center gap-2">
                  <Mail size={13} style={{ color: tokens.accentPrimary }} className="shrink-0" />
                  <a href={`mailto:${e}`} className="lunaris-footer-link break-all text-xs sm:text-sm">
                    {e}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lunaris-footer-divider mt-12 pt-6 text-center text-xs" style={{ color: tokens.textMuted }}>
          © 2026 Lunaris. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared small pieces for the discovery / details / personalized     */
/*  pages                                                              */
/* ------------------------------------------------------------------ */
function PageHeader({ eyebrow, title, subtitle, onBack, backLabel = "Back" }) {
  return (
    <div className="mx-auto max-w-4xl text-center">
      {onBack && (
        <div className="mb-6">
          <button type="button" onClick={onBack} className="lunaris-back-link inline-flex items-center gap-1.5 text-sm font-medium">
            <ArrowLeft size={14} /> {backLabel}
          </button>
        </div>
      )}
      {eyebrow && <p className="lunaris-eyebrow mb-3">{eyebrow}</p>}
      <h1 className="lunaris-heading text-3xl md:text-4xl">{title}</h1>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed md:text-base" style={{ color: tokens.textMuted }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="lunaris-filter-field">
      <span className="lunaris-filter-label">{label}</span>
      <select className="lunaris-filter-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function OpportunityCard({ opp, onView, matchPct }) {
  const elig = opp.eligibility || {};
  return (
    <GlassCard className="flex flex-col px-6 py-6">
      <div className="flex items-start justify-between gap-3">
        <span className="lunaris-tag self-start">{opp.category}</span>
        {typeof matchPct === "number" && (
          <span className="lunaris-match-chip">
            <Sparkles size={12} /> {matchPct}% match
          </span>
        )}
      </div>
      <h3 className="mt-4 text-base font-medium leading-snug" style={{ color: tokens.textPrimary }}>
        {opp.name}
      </h3>
      <p className="mt-1 text-xs" style={{ color: tokens.textSecondary }}>
        {opp.provider}
      </p>
      <p className="mt-3 text-sm leading-relaxed lunaris-clamp-3" style={{ color: tokens.textMuted }}>
        {opp.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {elig.education?.filter((e) => e !== "Any").slice(0, 2).map((e) => (
          <span key={e} className="lunaris-mini-badge">
            {e}
          </span>
        ))}
        {elig.category?.length && elig.category.length <= 3 &&
          elig.category.map((c) => (
            <span key={c} className="lunaris-mini-badge">
              {c}
            </span>
          ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed" style={{ color: tokens.textSecondary }}>
        {opp.benefits}
      </p>
      <button
        type="button"
        onClick={() => onView(opp.id)}
        className="lunaris-view-link mt-5 inline-flex items-center gap-1.5 self-start text-sm font-medium"
      >
        View Details <ArrowRight size={14} />
      </button>
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/*  "Ask Lunaris" — the Featherless AI explanation layer                */
/*  -------------------------------------------------------------------*/
/*  This sits ON TOP of Lunaris's existing matching/search logic. It    */
/*  never decides eligibility itself — it only receives whatever        */
/*  opportunities the deterministic engine (searchOpportunities /        */
/*  matchOpportunities, both in utils/matching.js, both unchanged)      */
/*  already surfaced, and asks Featherless to explain them in plain     */
/*  language. That's why this component takes `opportunities` as a      */
/*  prop instead of computing anything itself.                          */
/* ------------------------------------------------------------------ */
function AskLunarisPanel({ opportunities, profile, emptyHint }) {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  const hasContext = (opportunities || []).length > 0;
  const consideredCount = Math.min(opportunities?.length || 0, MAX_CONTEXT_OPPORTUNITIES);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim() || status === "loading") return;
    setStatus("loading");
    setError("");
    setAnswer("");
    try {
      const result = await askLunaris({ question: question.trim(), opportunities, profile });
      setAnswer(result);
      setStatus("done");
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="lunaris-ask-panel">
      <div className="lunaris-ask-header">
        <Sparkles size={16} />
        <span>Ask Lunaris</span>
        <span className="lunaris-ask-badge">
          <Sparkles size={10} /> Powered by Featherless AI
        </span>
      </div>

      {hasContext ? (
        <>
          <p className="lunaris-ask-sub">
            Ask a question in your own words about the {opportunities.length}{" "}
            {opportunities.length === 1 ? "opportunity" : "opportunities"} shown above
            {consideredCount < opportunities.length ? ` (Lunaris will consider the top ${consideredCount})` : ""}.
          </p>
          <form onSubmit={handleAsk} className="lunaris-search lunaris-ask-form">
            <Sparkles size={18} className="shrink-0" style={{ color: tokens.textMuted }} />
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. I'm an EWS engineering student from Telangana, family income ₹2 lakh — what can I apply for?"
              className="lunaris-search-input"
              disabled={status === "loading"}
            />
            <button type="submit" className="lunaris-search-btn" disabled={status === "loading" || !question.trim()}>
              {status === "loading" ? "Asking…" : "Ask Lunaris"}
            </button>
          </form>
        </>
      ) : (
        <p className="lunaris-ask-sub">{emptyHint || "Search or fill in your profile first so Lunaris has something to ask about."}</p>
      )}

      {status === "loading" && (
        <p className="lunaris-ask-loading">
          Asking Featherless AI about {consideredCount} matched {consideredCount === 1 ? "opportunity" : "opportunities"}…
        </p>
      )}

      {status === "error" && (
        <p className="lunaris-ask-error">
          <Info size={14} /> {error}
        </p>
      )}

      {status === "done" && (
        <div className="lunaris-ask-answer">
          <p>{answer}</p>
          <span className="lunaris-ask-badge">
            <Sparkles size={10} /> Powered by Featherless AI
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Discovery / Opportunity search page                                */
/* ------------------------------------------------------------------ */
function DiscoveryPage({ initialFilters, initialQuery }) {
  const { navigate } = useNav();
  const [query, setQuery] = useState(initialQuery || "");
  const [category, setCategory] = useState(initialFilters?.category || "All");
  const [level, setLevel] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");
  const [educationLevel, setEducationLevel] = useState("All");
  const [applicantCategory, setApplicantCategory] = useState("All");

  // If the user arrives from a different category tile after already
  // being on this page, respect the newly requested filter.
  useEffect(() => {
    if (initialFilters?.category) setCategory(initialFilters.category);
    if (typeof initialQuery === "string") setQuery(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilters, initialQuery]);

  const results = useMemo(() => {
    return searchOpportunities(opportunities, query, {
      category,
      level,
      state: stateFilter,
      educationLevel,
      applicantCategory,
    });
  }, [query, category, level, stateFilter, educationLevel, applicantCategory]);

  const resetFilters = () => {
    setQuery("");
    setCategory("All");
    setLevel("All");
    setStateFilter("All");
    setEducationLevel("All");
    setApplicantCategory("All");
  };

  const heading = category !== "All" ? category : "Find Opportunities";

  return (
    <section className="lunaris-section-discovery relative px-5 py-24 md:px-8">
      <PageHeader
        onBack={() => navigate("home")}
        eyebrow="Opportunity Discovery"
        title={heading}
        subtitle="Search and filter across scholarships, schemes, internships, fellowships and more — all from Lunaris's curated demo dataset."
      />

      <div className="mx-auto mt-10 max-w-5xl">
        <form
          className="lunaris-search"
          onSubmit={(e) => e.preventDefault()}
        >
          <Search size={18} className="shrink-0" style={{ color: tokens.textMuted }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, category, provider, tag..."
            className="lunaris-search-input"
          />
        </form>

        <div className="lunaris-filter-bar">
          <FilterSelect label="Category" value={category} onChange={setCategory} options={["All", ...CATEGORY_LIST]} />
          <FilterSelect label="Level" value={level} onChange={setLevel} options={["All", "Central", "State"]} />
          <FilterSelect label="State" value={stateFilter} onChange={setStateFilter} options={["All", ...INDIAN_STATES.filter((s) => s !== "All India")]} />
          <FilterSelect
            label="Education Level"
            value={educationLevel}
            onChange={setEducationLevel}
            options={["All", ...EDUCATION_LEVELS.filter((e) => e !== "Any")]}
          />
          <FilterSelect
            label="Applicant Category"
            value={applicantCategory}
            onChange={setApplicantCategory}
            options={["All", ...APPLICANT_CATEGORIES]}
          />
          <button type="button" onClick={resetFilters} className="lunaris-reset-btn">
            <RotateCcw size={14} /> Reset Filters
          </button>
        </div>

        <p className="mt-8 text-sm" style={{ color: tokens.textMuted }}>
          {results.length} {results.length === 1 ? "opportunity" : "opportunities"} found
        </p>

        {results.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((opp) => (
              <OpportunityCard key={opp.id} opp={opp} onView={(id) => navigate("details", { id })} />
            ))}
          </div>
        ) : (
          <div className="lunaris-empty-state mt-10">
            <Info size={22} />
            <p className="mt-3 text-sm" style={{ color: tokens.textMuted }}>
              No opportunities match your current filters. Try widening your search or resetting filters.
            </p>
            <button type="button" onClick={resetFilters} className="lunaris-reset-btn mt-4">
              <RotateCcw size={14} /> Reset Filters
            </button>
          </div>
        )}

        {results.length > 0 && <AskLunarisPanel opportunities={results} />}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Opportunity Details page                                          */
/* ------------------------------------------------------------------ */
function DetailsPage({ id }) {
  const { navigate } = useNav();
  const opp = opportunities.find((o) => o.id === id);

  if (!opp) {
    return (
      <section className="relative px-5 py-24 md:px-8">
        <PageHeader
          onBack={() => navigate("discovery")}
          backLabel="Back to Discovery"
          eyebrow="Opportunity Details"
          title="Opportunity not found"
          subtitle="This listing may have been removed from the demo dataset. Explore all current opportunities instead."
        />
      </section>
    );
  }

  const elig = opp.eligibility || {};

  const applySteps = [
    "Open the official application source using the button below.",
    "Register or log in on that official portal (Lunaris does not collect or store your application data).",
    "Fill in your personal, academic and category details exactly as requested by the official form.",
    "Upload the required documents listed below in the format specified by the portal.",
    "Submit the application and save your reference/application number for tracking.",
  ];

  return (
    <section className="relative px-5 py-24 md:px-8">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("discovery")}
          className="lunaris-back-link mb-8 inline-flex items-center gap-1.5 text-sm font-medium"
        >
          <ArrowLeft size={14} /> Back to Discovery
        </button>

        <span className="lunaris-tag">{opp.category}</span>
        <h1 className="lunaris-heading mt-4 text-2xl md:text-3xl">{opp.name}</h1>
        <p className="mt-2 text-sm" style={{ color: tokens.textSecondary }}>
          {opp.provider} · {opp.type}
        </p>

        <div className="lunaris-detail-meta mt-6">
          <span>
            <Landmark size={14} /> {opp.level}
          </span>
          <span>
            <MapPin size={14} /> {opp.state}
          </span>
        </div>

        <GlassCard hover={false} className="mt-8 px-6 py-6">
          <h2 className="lunaris-detail-heading">
            <FileText size={16} /> Description
          </h2>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: tokens.textMuted }}>
            {opp.description}
          </p>
        </GlassCard>

        <GlassCard hover={false} className="mt-5 px-6 py-6">
          <h2 className="lunaris-detail-heading">
            <ShieldCheck size={16} /> Eligibility — Who Can Apply
          </h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm" style={{ color: tokens.textMuted }}>
            <li>
              <strong style={{ color: tokens.textPrimary }}>Education level:</strong>{" "}
              {elig.education?.length ? elig.education.join(", ") : "Not education-restricted"}
            </li>
            <li>
              <strong style={{ color: tokens.textPrimary }}>Applicant category:</strong>{" "}
              {elig.category?.length ? elig.category.join(", ") : "Open to all categories"}
            </li>
            <li>
              <strong style={{ color: tokens.textPrimary }}>Gender:</strong> {elig.gender || "All"}
            </li>
            <li>
              <strong style={{ color: tokens.textPrimary }}>Age:</strong> {formatAgeRange(elig.minAge, elig.maxAge)}
            </li>
            <li>
              <strong style={{ color: tokens.textPrimary }}>Family income:</strong> {formatIncome(elig.incomeLimit)}
            </li>
          </ul>
        </GlassCard>

        <GlassCard hover={false} className="mt-5 px-6 py-6">
          <h2 className="lunaris-detail-heading">
            <IndianRupee size={16} /> Benefits
          </h2>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: tokens.textMuted }}>
            {opp.benefits}
          </p>
        </GlassCard>

        <GlassCard hover={false} className="mt-5 px-6 py-6">
          <h2 className="lunaris-detail-heading">
            <ClipboardList size={16} /> Documents Required
          </h2>
          <ul className="lunaris-doc-list mt-3">
            {opp.documents.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard hover={false} className="mt-5 px-6 py-6">
          <h2 className="lunaris-detail-heading">
            <Sparkles size={16} /> Application Process
          </h2>
          <ol className="lunaris-step-list mt-3">
            {applySteps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </GlassCard>

        <GlassCard hover={false} className="mt-5 px-6 py-6">
          <h2 className="lunaris-detail-heading">
            <CalendarClock size={16} /> Important Information
          </h2>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: tokens.textMuted }}>
            {opp.deadline}
          </p>
          <p className="lunaris-disclaimer mt-3">
            Lunaris helps you discover this opportunity — the official organization listed above handles the actual
            application and eligibility decision. Figures such as deadlines, income limits and benefit amounts change
            periodically; always confirm current details on the official website before applying.
          </p>
        </GlassCard>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a href={opp.applicationUrl} target="_blank" rel="noopener noreferrer" className="lunaris-btn-primary inline-flex items-center gap-2 rounded-full px-6 py-3 font-medium">
            <span>Apply / Official Website</span>
            <ExternalLink size={16} />
          </a>
          <SecondaryButton
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("discovery");
            }}
          >
            Explore More Opportunities
          </SecondaryButton>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Personalized "Find What You're Eligible For" flow                  */
/* ------------------------------------------------------------------ */
const EDUCATION_FORM_OPTIONS = ["School Student", "Undergraduate", "Postgraduate", "Doctoral / Research", "Not Currently Studying"];

function mapFormEducationToDataset(value) {
  switch (value) {
    case "School Student":
      return "School";
    case "Undergraduate":
      return "Undergraduate";
    case "Postgraduate":
      return "Postgraduate";
    case "Doctoral / Research":
      return "Doctoral";
    default:
      return "Any";
  }
}

function PersonalizedPage() {
  const { navigate } = useNav();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    age: "",
    gender: "Female",
    education: "Undergraduate",
    state: "Telangana",
    category: "General",
    income: "",
    disability: false,
    minority: false,
  });

  const profile = useMemo(
    () => ({
      age: form.age,
      gender: form.gender,
      education: mapFormEducationToDataset(form.education),
      state: form.state,
      category: form.category,
      income: form.income,
      disability: form.disability,
      minority: form.minority,
    }),
    [form]
  );

  const results = useMemo(() => (submitted ? matchOpportunities(opportunities, profile) : []), [submitted, profile]);

  const update = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  if (submitted) {
    return (
      <section className="relative px-5 py-24 md:px-8">
        <PageHeader
          onBack={() => setSubmitted(false)}
          backLabel="Edit My Profile"
          eyebrow="Personalized Discovery"
          title={`We found ${results.length} opportunit${results.length === 1 ? "y" : "ies"} that may fit your profile`}
          subtitle="Lunaris Match Score is an informational estimate based on the details you provided — it is not an official eligibility decision."
        />

        <div className="mx-auto mt-10 max-w-5xl">
          {results.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((opp) => (
                <div key={opp.id} className="lunaris-match-card">
                  <OpportunityCard opp={opp} onView={(id) => navigate("details", { id })} matchPct={opp._match.pct} />
                  <div className="lunaris-why-match">
                    <p className="lunaris-why-match-title">Why this may be relevant</p>
                    <ul>
                      {opp._match.reasons.slice(0, 4).map((r, i) => (
                        <li key={i}>
                          <CheckCircle2 size={13} /> {r}
                        </li>
                      ))}
                    </ul>
                    <p className="lunaris-disclaimer mt-3">Potential match — verify official eligibility on the scheme page.</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="lunaris-empty-state">
              <Info size={22} />
              <p className="mt-3 text-sm" style={{ color: tokens.textMuted }}>
                We couldn&rsquo;t find a strong match with the details provided. Try adjusting your profile, or browse the
                full list of opportunities instead.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={() => setSubmitted(false)} className="lunaris-reset-btn">
                  <RotateCcw size={14} /> Edit My Profile
                </button>
                <SecondaryButton
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("discovery");
                  }}
                >
                  Browse All Opportunities
                </SecondaryButton>
              </div>
            </div>
          )}

          <p className="lunaris-disclaimer mt-10 text-center">
            This is an informational recommendation. Verify official eligibility before applying.
          </p>

          {results.length > 0 && <AskLunarisPanel opportunities={results} profile={profile} />}
        </div>
      </section>
    );
  }

  return (
    <section className="relative px-5 py-24 md:px-8">
      <PageHeader
        onBack={() => navigate("home")}
        eyebrow="Personalized Discovery"
        title="Find What You're Eligible For"
        subtitle="Tell Lunaris a little about yourself. This stays on your device for this demo — nothing is sent anywhere except to compute your matches."
      />

      <form
        className="lunaris-profile-form mx-auto mt-10 max-w-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <div className="lunaris-profile-grid">
          <label className="lunaris-filter-field">
            <span className="lunaris-filter-label">Age</span>
            <input type="number" min="0" max="100" value={form.age} onChange={update("age")} className="lunaris-filter-select" placeholder="e.g. 19" />
          </label>

          <label className="lunaris-filter-field">
            <span className="lunaris-filter-label">Gender</span>
            <select className="lunaris-filter-select" value={form.gender} onChange={update("gender")}>
              {["Female", "Male", "Other"].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>

          <label className="lunaris-filter-field">
            <span className="lunaris-filter-label">Education Level</span>
            <select className="lunaris-filter-select" value={form.education} onChange={update("education")}>
              {EDUCATION_FORM_OPTIONS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </label>

          <label className="lunaris-filter-field">
            <span className="lunaris-filter-label">State</span>
            <select className="lunaris-filter-select" value={form.state} onChange={update("state")}>
              {INDIAN_STATES.filter((s) => s !== "All India").map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="lunaris-filter-field">
            <span className="lunaris-filter-label">Category</span>
            <select className="lunaris-filter-select" value={form.category} onChange={update("category")}>
              {APPLICANT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="lunaris-filter-field">
            <span className="lunaris-filter-label">Annual Family Income (₹)</span>
            <input
              type="number"
              min="0"
              value={form.income}
              onChange={update("income")}
              className="lunaris-filter-select"
              placeholder="e.g. 200000"
            />
          </label>
        </div>

        <div className="lunaris-profile-checks">
          <label className="lunaris-checkbox-row">
            <input type="checkbox" checked={form.disability} onChange={update("disability")} />
            <span>I identify as a person with a disability</span>
          </label>
          <label className="lunaris-checkbox-row">
            <input type="checkbox" checked={form.minority} onChange={update("minority")} />
            <span>I belong to a notified minority community</span>
          </label>
        </div>

        <button type="submit" className="lunaris-btn-primary mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-medium sm:w-auto">
          <span>Find Opportunities For Me</span>
          <ArrowRight size={16} />
        </button>
      </form>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Global styles                                                      */
/* ------------------------------------------------------------------ */
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');

      /* ============================================================ */
      /*  Theme system — Huemint palette (black + pale blue + mint +   */
      /*  bright cyan). Every color in the app reads from these        */
      /*  variables (via the \`tokens\` object or directly), so          */
      /*  switching [data-theme] on <html> re-colors everything at     */
      /*  once. Dark is the default/primary experience.                */
      /* ============================================================ */
      :root, [data-theme="dark"] {
        --color-bg: #000000;
        --color-bg-rgb: 0, 0, 0;
        --color-bg-elevated: #070D12;
        --color-bg-elevated-rgb: 7, 13, 18;
        --color-surface: #0C1720;
        --color-surface-rgb: 12, 23, 32;

        --color-primary: #3C9ED3;
        --color-primary-rgb: 60, 158, 211;
        --color-secondary: #96CCCA;
        --color-secondary-rgb: 150, 204, 202;
        --color-accent: #D8E3F2;
        --color-accent-rgb: 216, 227, 242;

        --color-text: #D8E3F2;
        --color-text-muted: #7E97A0;
        --color-border: rgba(150, 204, 202, 0.18);
        --color-border-rgb: 150, 204, 202;
        --color-glow: #3C9ED3;

        --color-star-core: 255, 255, 255;
        --color-glass-rgb: 255, 255, 255;
      }

      [data-theme="light"] {
        --color-bg: #F4F9FC;
        --color-bg-rgb: 244, 249, 252;
        --color-bg-elevated: #FFFFFF;
        --color-bg-elevated-rgb: 255, 255, 255;
        --color-surface: #FFFFFF;
        --color-surface-rgb: 255, 255, 255;

        --color-primary: #1C7FAE;
        --color-primary-rgb: 28, 127, 174;
        --color-secondary: #2E8B87;
        --color-secondary-rgb: 46, 139, 135;
        --color-accent: #1C7FAE;
        --color-accent-rgb: 28, 127, 174;

        --color-text: #10181E;
        --color-text-muted: #4C6169;
        --color-border: rgba(28, 127, 174, 0.22);
        --color-border-rgb: 28, 127, 174;
        --color-glow: #3C9ED3;

        --color-star-core: 20, 45, 58;
        --color-glass-rgb: 8, 28, 38;
      }

      .lunaris-root, .lunaris-root * {
        transition: background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
      }

      .lunaris-root {
        background: linear-gradient(180deg, ${tokens.voidBlack} 0%, ${tokens.deepSurface} 40%, ${tokens.voidBlack} 100%);
        font-family: 'Inter', sans-serif;
        color: ${tokens.textPrimary};
        position: relative;
        overflow-x: hidden;
        min-height: 100vh;
      }
      .lunaris-global-canvas {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
      }
      .lunaris-root > *:not(.lunaris-global-canvas) {
        position: relative;
        z-index: 1;
      }

      .lunaris-heading, .lunaris-hero-heading {
        font-family: 'Manrope', sans-serif;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: ${tokens.textPrimary};
      }
      .lunaris-hero-heading { font-weight: 800; }

      /* Section depth layers — subtle translucent tints over the shared starfield */
      .lunaris-section-stats { background: rgba(var(--color-surface-rgb),0.16); }
      .lunaris-section-categories {
        background: rgba(var(--color-bg-elevated-rgb),0.34);
        border-top: 1px solid ${tokens.hairline};
        border-bottom: 1px solid ${tokens.hairline};
      }
      .lunaris-section-personalized {
        background: radial-gradient(circle at 50% 30%, rgba(var(--color-primary-rgb),0.10), transparent 65%);
      }
      .lunaris-section-how {
        background: radial-gradient(ellipse 70% 50% at 20% 20%, rgba(var(--color-primary-rgb),0.08), transparent 60%),
                    radial-gradient(ellipse 70% 50% at 80% 80%, rgba(var(--color-secondary-rgb),0.06), transparent 60%);
      }
      .lunaris-section-featured { background: rgba(var(--color-bg-elevated-rgb),0.2); }
      .lunaris-section-why { background: transparent; }
      .lunaris-final-cta {
        background: radial-gradient(ellipse 80% 70% at 50% 40%, rgba(var(--color-primary-rgb),0.22), transparent 70%),
                    linear-gradient(180deg, rgba(var(--color-surface-rgb),0.4), rgba(var(--color-bg-rgb),0.7));
      }

      /* Navbar */
      .lunaris-navbar {
        position: sticky;
        top: 0;
        z-index: 50;
        background: transparent;
        border-bottom: 1px solid transparent;
        transition: background 0.3s ease, border-color 0.3s ease;
      }
      .lunaris-navbar-scrolled {
        background: rgba(var(--color-bg-rgb), 0.75);
        backdrop-filter: blur(16px);
        border-bottom: 1px solid ${tokens.hairline};
      }
      .lunaris-nav-link {
        color: ${tokens.textMuted};
        text-decoration: none;
        transition: color 0.2s ease;
      }
      .lunaris-nav-link:hover { color: ${tokens.textPrimary}; }
      .lunaris-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 999px;
        color: ${tokens.textSecondary};
        background: rgba(var(--color-glass-rgb),0.03);
        border: 1px solid ${tokens.hairline};
        transition: background 0.2s ease, color 0.2s ease;
      }
      .lunaris-icon-btn:hover { background: rgba(var(--color-primary-rgb),0.15); color: ${tokens.textPrimary}; }
      .lunaris-signin {
        color: ${tokens.voidBlack};
        background: linear-gradient(135deg, ${tokens.textSecondary}, ${tokens.accentPrimary});
        text-decoration: none;
        transition: filter 0.2s ease;
      }
      .lunaris-signin:hover { filter: brightness(1.08); }
      .lunaris-mobile-theme-toggle {
        color: ${tokens.textSecondary};
        background: rgba(var(--color-glass-rgb),0.03);
        border: 1px solid ${tokens.hairline};
        cursor: pointer;
        transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
      }
      .lunaris-mobile-theme-toggle:hover {
        background: rgba(var(--color-primary-rgb),0.1);
        border-color: rgba(var(--color-border-rgb),0.4);
        color: ${tokens.textPrimary};
      }

      /* Floating glass menu panel */
      .lunaris-menu-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(var(--color-bg-rgb),0.55);
        z-index: 200;
      }
      .lunaris-menu-backdrop-in { animation: lunaris-backdrop-in 0.2s ease forwards; }
      .lunaris-menu-backdrop-out { animation: lunaris-backdrop-out 0.18s ease forwards; }
      @keyframes lunaris-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes lunaris-backdrop-out { from { opacity: 1; } to { opacity: 0; } }

      .lunaris-menu-panel {
        position: fixed;
        top: 74px;
        right: 16px;
        left: 16px;
        z-index: 210;
        max-width: 320px;
        margin-left: auto;
        border-radius: 20px;
        /* Fully opaque — no alpha channel anywhere in this background, so no page content can show through */
        background: linear-gradient(165deg, ${tokens.midSurface} 0%, ${tokens.deepSurface} 55%, ${tokens.voidBlack} 100%);
        border: 1px solid rgba(var(--color-border-rgb),0.35);
        box-shadow: 0 24px 70px rgba(0,0,0,0.65), 0 0 50px rgba(var(--color-primary-rgb),0.18);
        transform-origin: top right;
        overflow: hidden;
      }
      @media (min-width: 480px) {
        .lunaris-menu-panel { left: auto; width: 300px; }
      }
      .lunaris-menu-panel-in { animation: lunaris-panel-in 0.22s cubic-bezier(0.22,1,0.36,1) forwards; }
      .lunaris-menu-panel-out { animation: lunaris-panel-out 0.18s ease forwards; }
      @keyframes lunaris-panel-in {
        from { opacity: 0; transform: scale(0.92) translateY(-8px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes lunaris-panel-out {
        from { opacity: 1; transform: scale(1) translateY(0); }
        to { opacity: 0; transform: scale(0.94) translateY(-6px); }
      }
      .lunaris-nav-link-panel {
        display: block;
        padding: 11px 12px;
        border-radius: 12px;
        font-size: 0.9rem;
        color: ${tokens.textSecondary};
        text-decoration: none;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .lunaris-nav-link-panel:hover { background: rgba(var(--color-primary-rgb),0.12); color: ${tokens.textPrimary}; }
      .lunaris-menu-divider {
        height: 1px;
        margin: 14px 20px 0;
        background: ${tokens.hairline};
      }

      /* Hero */
      .lunaris-hero {
        min-height: 92vh;
        background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(var(--color-primary-rgb),0.16), transparent 60%);
      }
      .lunaris-moon {
        position: absolute;
        top: -120px;
        right: -80px;
        width: 380px;
        height: 380px;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 35%, ${tokens.paleAccent}, #4E93B8 55%, transparent 72%);
        opacity: 0.15;
        filter: blur(2px);
        animation: lunaris-drift 14s ease-in-out infinite;
      }
      @keyframes lunaris-drift {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(16px); }
      }
      .lunaris-constellation {
        position: absolute;
        top: 0;
        right: 0;
        width: 60%;
        height: 100%;
        stroke: ${tokens.accentPrimary};
        stroke-width: 1;
        opacity: 0.3;
        fill: ${tokens.textSecondary};
        pointer-events: none;
      }

      /* Hero brand lockup */
      .lunaris-brand-lockup {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
      }
      .lunaris-brand-word-wrap {
        position: relative;
        display: inline-flex;
        padding: 6px 22px;
      }
      .lunaris-brand-sparkle {
        position: absolute;
        color: ${tokens.textSecondary};
        line-height: 1;
        pointer-events: none;
        animation: lunaris-sparkle-twinkle 3s ease-in-out infinite;
      }
      .lunaris-brand-sparkle-1 { top: -4px; left: 4px; font-size: 0.85rem; animation-delay: 0s; }
      .lunaris-brand-sparkle-2 { top: 8px; right: 2px; font-size: 0.6rem; animation-delay: 0.9s; }
      .lunaris-brand-sparkle-3 { bottom: 6px; left: -2px; font-size: 0.55rem; animation-delay: 1.7s; }
      .lunaris-brand-sparkle-4 { bottom: -6px; right: 10px; font-size: 0.75rem; animation-delay: 2.4s; }
      @media (min-width: 768px) {
        .lunaris-brand-sparkle-1 { top: -10px; left: 10px; font-size: 1.15rem; }
        .lunaris-brand-sparkle-2 { top: 14px; right: -8px; font-size: 0.8rem; }
        .lunaris-brand-sparkle-3 { bottom: 12px; left: -14px; font-size: 0.7rem; }
        .lunaris-brand-sparkle-4 { bottom: -10px; right: 14px; font-size: 1rem; }
      }
      @keyframes lunaris-sparkle-twinkle {
        0%, 100% { opacity: 0.15; transform: scale(0.75); }
        50% { opacity: 1; transform: scale(1.15); }
      }
      .lunaris-brand-word {
        position: relative;
        z-index: 1;
        font-family: 'Manrope', sans-serif;
        font-weight: 800;
        font-size: 3rem;
        line-height: 1;
        letter-spacing: 0.01em;
        margin: 0;
        background: linear-gradient(135deg, ${tokens.textPrimary}, ${tokens.textSecondary} 55%, ${tokens.accentPrimary});
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        text-shadow: 0 0 60px rgba(var(--color-primary-rgb),0.4);
      }
      .lunaris-brand-tagline {
        margin: 0;
        font-size: 0.95rem;
        color: ${tokens.textMuted};
        letter-spacing: 0.01em;
      }
      @media (min-width: 768px) {
        .lunaris-brand-word { font-size: 5.25rem; }
        .lunaris-brand-tagline { font-size: 1.05rem; }
      }

      .lunaris-btn-primary {
        background: linear-gradient(135deg, ${tokens.textSecondary}, ${tokens.accentPrimary});
        color: ${tokens.voidBlack};
        text-decoration: none;
        transition: transform 0.2s ease, filter 0.2s ease;
      }
      .lunaris-btn-primary:hover { filter: brightness(1.08); }
      .lunaris-btn-primary:hover .lunaris-btn-arrow { transform: translateX(3px); }
      .lunaris-btn-arrow { transition: transform 0.2s ease; }
      .lunaris-btn-secondary {
        color: ${tokens.textPrimary};
        border: 1px solid ${tokens.hairline};
        text-decoration: none;
        background: rgba(var(--color-glass-rgb),0.02);
        transition: background 0.2s ease, border-color 0.2s ease;
      }
      .lunaris-btn-secondary:hover {
        background: rgba(var(--color-primary-rgb),0.1);
        border-color: rgba(var(--color-border-rgb),0.4);
      }

      .lunaris-search {
        display: flex;
        align-items: center;
        gap: 12px;
        background: rgba(var(--color-glass-rgb),0.04);
        border: 1px solid ${tokens.hairline};
        border-radius: 999px;
        padding: 8px 8px 8px 22px;
        backdrop-filter: blur(12px);
        box-shadow: 0 0 40px rgba(var(--color-primary-rgb),0.08);
      }
      .lunaris-search-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: ${tokens.textPrimary};
        font-size: 0.95rem;
      }
      .lunaris-search-input::placeholder { color: ${tokens.textMuted}; }
      .lunaris-search-btn {
        background: linear-gradient(135deg, ${tokens.textSecondary}, ${tokens.accentPrimary});
        color: ${tokens.voidBlack};
        border: none;
        border-radius: 999px;
        padding: 10px 22px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: filter 0.2s ease;
      }
      .lunaris-search-btn:hover { filter: brightness(1.08); }

      /* Ask Lunaris (Featherless AI) */
      .lunaris-ask-panel {
        margin-top: 48px;
        padding: 28px;
        border-radius: 20px;
        border: 1px solid rgba(var(--color-primary-rgb),0.3);
        background: rgba(var(--color-glass-rgb),0.03);
      }
      .lunaris-ask-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 1rem;
        color: ${tokens.textPrimary};
      }
      .lunaris-ask-header svg { color: ${tokens.accentPrimary}; }
      .lunaris-ask-badge {
        margin-left: auto;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.65rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        padding: 4px 10px;
        border-radius: 999px;
        color: ${tokens.accentPrimary};
        background: rgba(var(--color-primary-rgb),0.12);
        border: 1px solid rgba(var(--color-primary-rgb),0.3);
        white-space: nowrap;
      }
      .lunaris-ask-sub {
        margin-top: 8px;
        font-size: 0.85rem;
        color: ${tokens.textMuted};
      }
      .lunaris-ask-form { margin-top: 18px; }
      .lunaris-ask-form .lunaris-search-btn:disabled,
      .lunaris-ask-form .lunaris-search-input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .lunaris-ask-loading {
        margin-top: 16px;
        font-size: 0.85rem;
        color: ${tokens.textMuted};
        font-style: italic;
      }
      .lunaris-ask-error {
        margin-top: 16px;
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 0.85rem;
        line-height: 1.5;
        color: #E8918C;
      }
      .lunaris-ask-error svg { flex-shrink: 0; margin-top: 2px; }
      .lunaris-ask-answer {
        margin-top: 18px;
        padding: 18px 20px;
        border-radius: 14px;
        background: rgba(var(--color-secondary-rgb),0.07);
        border: 1px solid rgba(var(--color-secondary-rgb),0.25);
      }
      .lunaris-ask-answer p {
        font-size: 0.92rem;
        line-height: 1.65;
        color: ${tokens.textPrimary};
        white-space: pre-line;
      }
      .lunaris-ask-answer .lunaris-ask-badge {
        margin-left: 0;
        margin-top: 12px;
      }

      /* Glass cards */
      .lunaris-glass {
        background: rgba(var(--color-glass-rgb),0.03);
        border: 1px solid ${tokens.hairline};
        border-radius: 20px;
        backdrop-filter: blur(10px);
        transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
      }
      .lunaris-glass-hover:hover {
        transform: translateY(-3px);
        border-color: rgba(var(--color-border-rgb),0.45);
        box-shadow: 0 12px 40px rgba(var(--color-primary-rgb),0.12);
      }

      /* Stat card icons */
      .lunaris-stat-icon {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${tokens.textSecondary};
        background: linear-gradient(135deg, rgba(var(--color-primary-rgb),0.32), rgba(var(--color-primary-rgb),0.05));
        border: 1px solid rgba(var(--color-border-rgb),0.3);
        box-shadow: 0 0 24px rgba(var(--color-primary-rgb),0.18);
      }

      /* Category icon grid — no boxes, just icon + label */
      .lunaris-cat-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 30px 14px;
      }
      @media (min-width: 640px) {
        .lunaris-cat-grid { grid-template-columns: repeat(3, 1fr); gap: 34px 18px; }
      }
      @media (min-width: 1024px) {
        .lunaris-cat-grid { grid-template-columns: repeat(4, 1fr); gap: 38px 20px; }
      }
      @media (min-width: 1280px) {
        .lunaris-cat-grid { grid-template-columns: repeat(5, 1fr); }
      }
      .lunaris-cat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        text-align: center;
        text-decoration: none;
        padding: 6px 4px;
        transition: transform 0.25s ease;
      }
      .lunaris-cat-item:hover { transform: translateY(-4px); }
      .lunaris-cat-item-icon {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--cat-color, ${tokens.textSecondary});
        background: radial-gradient(circle at 35% 30%, var(--cat-bg, rgba(var(--color-primary-rgb),0.16)), rgba(var(--color-glass-rgb),0.02) 72%);
        border: 1px solid var(--cat-border, rgba(var(--color-border-rgb),0.28));
        transition: box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease;
      }
      .lunaris-cat-item:hover .lunaris-cat-item-icon {
        transform: scale(1.08);
        box-shadow: 0 0 26px var(--cat-glow, rgba(var(--color-primary-rgb),0.4));
      }
      .lunaris-cat-item-name {
        font-size: 0.85rem;
        font-weight: 500;
        color: ${tokens.textMuted};
        transition: color 0.25s ease;
      }
      .lunaris-cat-item:hover .lunaris-cat-item-name { color: ${tokens.textPrimary}; }

      .lunaris-radial-glow {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 50% 40%, rgba(var(--color-primary-rgb),0.14), transparent 60%);
        pointer-events: none;
      }

      .lunaris-pill {
        padding: 8px 16px;
        border-radius: 999px;
        font-size: 0.8rem;
        color: ${tokens.textSecondary};
        background: rgba(var(--color-primary-rgb),0.08);
        border: 1px solid ${tokens.hairline};
      }

      /* How it works */
      .lunaris-steps {
        display: grid;
        grid-template-columns: repeat(1, 1fr);
        gap: 40px;
      }
      @media (min-width: 768px) {
        .lunaris-steps { grid-template-columns: repeat(4, 1fr); gap: 24px; }
      }
      .lunaris-step { position: relative; }
      .lunaris-step-num {
        font-family: 'Manrope', sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: ${tokens.accentPrimary};
        opacity: 0.85;
      }
      .lunaris-step-line { display: none; }
      @media (min-width: 768px) {
        .lunaris-step-line {
          display: block;
          position: absolute;
          top: 14px;
          left: calc(100% + 8px);
          width: calc(24px + 1px);
          height: 1px;
          background: linear-gradient(90deg, ${tokens.hairline}, transparent);
        }
      }

      .lunaris-tag {
        font-size: 0.7rem;
        padding: 4px 10px;
        border-radius: 999px;
        color: ${tokens.accentPrimary};
        background: rgba(var(--color-primary-rgb),0.12);
        border: 1px solid rgba(var(--color-border-rgb),0.25);
      }
      .lunaris-view-link {
        color: ${tokens.textSecondary};
        text-decoration: none;
        transition: color 0.2s ease;
      }
      .lunaris-view-link:hover { color: ${tokens.textPrimary}; }

      /* Orbit diagram — premium lunar visualization */
      .lunaris-orbit-wrap {
        position: relative;
        width: 320px;
        height: 320px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      @media (max-width: 480px) {
        .lunaris-orbit-wrap { width: 260px; height: 260px; }
      }
      .lunaris-orbit-field {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .lunaris-orbit-star {
        position: absolute;
        width: 2px;
        height: 2px;
        border-radius: 50%;
        background: rgba(var(--color-glass-rgb),0.75);
        animation: lunaris-orbit-star-twinkle 3.2s ease-in-out infinite;
      }
      @keyframes lunaris-orbit-star-twinkle {
        0%, 100% { opacity: 0.15; }
        50% { opacity: 0.9; }
      }
      .lunaris-orbit-ring {
        position: absolute;
        border-radius: 50%;
      }
      .lunaris-orbit-ring-outer {
        width: 280px;
        height: 280px;
        border: 1px dashed rgba(var(--color-border-rgb),0.3);
        animation: lunaris-spin 50s linear infinite;
      }
      .lunaris-orbit-ring-inner {
        width: 220px;
        height: 220px;
        border: 1px solid rgba(var(--color-border-rgb),0.14);
        animation: lunaris-spin-reverse 65s linear infinite;
      }
      @media (max-width: 480px) {
        .lunaris-orbit-ring-outer { width: 230px; height: 230px; }
        .lunaris-orbit-ring-inner { width: 180px; height: 180px; }
      }
      @keyframes lunaris-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes lunaris-spin-reverse {
        from { transform: rotate(360deg); }
        to { transform: rotate(0deg); }
      }
      .lunaris-moon-orb {
        position: relative;
        width: 92px;
        height: 92px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: radial-gradient(circle at 32% 28%, #EAF3FB 0%, #BFE3E0 20%, #3C9ED3 55%, #0A2836 88%);
        box-shadow: 0 0 55px rgba(var(--color-primary-rgb),0.45), inset -10px -10px 24px rgba(0,0,0,0.35);
        animation: lunaris-orb-float 7s ease-in-out infinite;
        overflow: hidden;
      }
      @media (max-width: 480px) {
        .lunaris-moon-orb { width: 74px; height: 74px; }
      }
      @keyframes lunaris-orb-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-7px); }
      }
      .lunaris-moon-orb-glow {
        position: absolute;
        inset: -30px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(var(--color-primary-rgb),0.35), transparent 70%);
        filter: blur(10px);
        z-index: -1;
        animation: lunaris-orb-pulse 5s ease-in-out infinite;
      }
      @keyframes lunaris-orb-pulse {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 0.9; transform: scale(1.12); }
      }
      .lunaris-moon-crater {
        position: absolute;
        border-radius: 50%;
        background: rgba(0,0,0,0.16);
        box-shadow: inset 2px 2px 4px rgba(0,0,0,0.25);
      }
      .lunaris-moon-crater-1 { width: 16px; height: 16px; top: 18px; left: 20px; }
      .lunaris-moon-crater-2 { width: 10px; height: 10px; top: 48px; left: 54px; }
      .lunaris-moon-crater-3 { width: 7px; height: 7px; top: 30px; left: 62px; }
      .lunaris-orbit-node-pos {
        position: absolute;
      }
      .lunaris-orbit-node {
        display: inline-block;
        font-size: 0.7rem;
        padding: 5px 10px;
        border-radius: 999px;
        white-space: nowrap;
        color: ${tokens.textSecondary};
        background: rgba(var(--color-glass-rgb),0.03);
        border: 1px solid ${tokens.hairline};
        backdrop-filter: blur(6px);
        animation: lunaris-node-float 4s ease-in-out infinite;
      }
      @keyframes lunaris-node-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }

      /* Footer */
      .lunaris-footer {
        border-top: 1px solid ${tokens.hairline};
        background: rgba(var(--color-bg-rgb),0.7);
        backdrop-filter: blur(6px);
      }
      .lunaris-footer-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 40px;
      }
      @media (min-width: 768px) {
        .lunaris-footer-grid {
          grid-template-columns: 1.3fr 1fr 1fr 1.3fr;
          gap: 28px;
        }
      }
      .lunaris-footer-link {
        color: ${tokens.textMuted};
        text-decoration: none;
        transition: color 0.2s ease;
      }
      .lunaris-footer-link:hover { color: ${tokens.textSecondary}; }
      .lunaris-footer-divider { border-top: 1px solid ${tokens.hairline}; }

      /* ---------------------------------------------------------- */
      /*  Discovery / Details / Personalized pages                   */
      /* ---------------------------------------------------------- */
      .lunaris-back-link {
        background: none;
        border: none;
        cursor: pointer;
        color: ${tokens.textSecondary};
        padding: 0;
        transition: color 0.2s ease;
      }
      .lunaris-back-link:hover { color: ${tokens.textPrimary}; }

      .lunaris-eyebrow {
        display: inline-block;
        font-size: 0.7rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: ${tokens.accentPrimary};
      }

      .lunaris-filter-bar {
        margin-top: 24px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 14px;
        align-items: end;
      }
      @media (min-width: 900px) {
        .lunaris-filter-bar {
          grid-template-columns: repeat(5, 1fr) auto;
        }
      }
      .lunaris-filter-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .lunaris-filter-label {
        font-size: 0.72rem;
        color: ${tokens.textMuted};
      }
      .lunaris-filter-select {
        appearance: none;
        width: 100%;
        border-radius: 12px;
        padding: 10px 14px;
        font-size: 0.85rem;
        color: ${tokens.textPrimary};
        background: rgba(var(--color-glass-rgb),0.03);
        border: 1px solid ${tokens.hairline};
        outline: none;
      }
      .lunaris-filter-select:focus {
        border-color: ${tokens.accentPrimary};
      }
      .lunaris-reset-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        border-radius: 999px;
        padding: 10px 18px;
        font-size: 0.8rem;
        font-weight: 500;
        color: ${tokens.textSecondary};
        background: rgba(var(--color-primary-rgb),0.08);
        border: 1px solid ${tokens.hairline};
        cursor: pointer;
        white-space: nowrap;
        transition: background 0.2s ease, color 0.2s ease;
      }
      .lunaris-reset-btn:hover {
        background: rgba(var(--color-primary-rgb),0.16);
        color: ${tokens.textPrimary};
      }

      .lunaris-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 48px 24px;
        border-radius: 20px;
        border: 1px dashed ${tokens.hairline};
        color: ${tokens.textSecondary};
      }

      .lunaris-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .lunaris-mini-badge {
        font-size: 0.65rem;
        padding: 3px 9px;
        border-radius: 999px;
        color: ${tokens.textSecondary};
        background: rgba(var(--color-glass-rgb),0.04);
        border: 1px solid ${tokens.hairline};
      }

      .lunaris-match-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.68rem;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 999px;
        color: ${tokens.paleAccent};
        background: linear-gradient(90deg, rgba(var(--color-primary-rgb),0.35), rgba(var(--color-secondary-rgb),0.2));
        border: 1px solid rgba(var(--color-secondary-rgb),0.3);
        white-space: nowrap;
      }

      .lunaris-match-card {
        display: flex;
        flex-direction: column;
      }
      .lunaris-why-match {
        margin-top: 10px;
        padding: 14px 16px;
        border-radius: 14px;
        background: rgba(var(--color-primary-rgb),0.06);
        border: 1px solid ${tokens.hairline};
      }
      .lunaris-why-match-title {
        font-size: 0.75rem;
        font-weight: 600;
        color: ${tokens.textPrimary};
        margin-bottom: 8px;
      }
      .lunaris-why-match ul {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .lunaris-why-match li {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        font-size: 0.78rem;
        color: ${tokens.textMuted};
      }
      .lunaris-why-match li svg { color: ${tokens.accentPrimary}; margin-top: 2px; flex-shrink: 0; }

      .lunaris-disclaimer {
        font-size: 0.72rem;
        line-height: 1.5;
        color: ${tokens.textMuted};
        font-style: italic;
      }

      .lunaris-detail-heading {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.95rem;
        font-weight: 600;
        color: ${tokens.textPrimary};
      }
      .lunaris-detail-heading svg { color: ${tokens.accentPrimary}; }

      .lunaris-detail-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-top: 8px;
      }
      .lunaris-detail-meta span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8rem;
        color: ${tokens.textMuted};
      }
      .lunaris-detail-meta svg { color: ${tokens.accentPrimary}; }

      .lunaris-doc-list, .lunaris-step-list {
        margin-top: 4px;
        padding-left: 20px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 0.85rem;
        color: ${tokens.textMuted};
      }
      .lunaris-doc-list { list-style: disc; }
      .lunaris-step-list { list-style: decimal; }

      .lunaris-profile-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
      }
      @media (min-width: 640px) {
        .lunaris-profile-grid { grid-template-columns: 1fr 1fr; }
      }
      .lunaris-profile-checks {
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .lunaris-checkbox-row {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.85rem;
        color: ${tokens.textMuted};
      }
      .lunaris-checkbox-row input {
        width: 16px;
        height: 16px;
        accent-color: ${tokens.accentPrimary};
      }

      @media (prefers-reduced-motion: reduce) {
        .lunaris-moon,
        .lunaris-orbit-ring-outer,
        .lunaris-orbit-ring-inner,
        .lunaris-moon-orb,
        .lunaris-moon-orb-glow,
        .lunaris-orbit-node,
        .lunaris-orbit-star,
        .lunaris-brand-sparkle {
          animation: none !important;
        }
      }
    `}</style>
  );
}

/* ------------------------------------------------------------------ */
/*  Homepage (unchanged) — original design, layout and sections        */
/* ------------------------------------------------------------------ */
function HomePage({ scrollTo }) {
  useEffect(() => {
    if (!scrollTo) return;
    const el = document.getElementById(scrollTo);
    if (el) {
      // wait a frame so the section is in the DOM before scrolling
      requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }, [scrollTo]);

  return (
    <>
      <Hero />
      <Stats />
      <Categories />
      <PersonalizedDiscovery />
      <HowItWorks />
      <FeaturedOpportunities />
      <WhyLunaris />
      <FinalCTA />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */
const THEME_STORAGE_KEY = "lunaris-theme";

export default function LunarisHomepage() {
  const [view, setView] = useState({ name: "home" });

  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      return saved === "light" ? "light" : "dark"; // dark is always the default
    } catch {
      return "dark";
    }
  });

  // Apply the theme to <html> as early as possible (before paint) so
  // returning light-mode users don't see a flash of dark first.
  useLayoutEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // localStorage unavailable (private browsing, etc.) — theme just won't persist
      }
      return next;
    });
  }, []);

  const navigate = useCallback((name, params = {}) => {
    setView({ name, ...params });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const navValue = useMemo(
    () => ({ view, navigate, theme, toggleTheme }),
    [view, navigate, theme, toggleTheme]
  );

  return (
    <NavContext.Provider value={navValue}>
      <div className="lunaris-root">
        <GlobalStyles />
        <GlobalStarfield theme={theme} />
        <Navbar />
        {view.name === "home" && <HomePage scrollTo={view.scrollTo} />}
        {view.name === "discovery" && <DiscoveryPage initialFilters={view.filters} initialQuery={view.query} />}
        {view.name === "details" && <DetailsPage id={view.id} />}
        {view.name === "personalized" && <PersonalizedPage />}
        <Footer />
      </div>
    </NavContext.Provider>
  );
}
