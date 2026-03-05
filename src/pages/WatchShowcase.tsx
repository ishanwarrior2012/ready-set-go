import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { ChevronDown, ChevronUp, Clock, Star, Zap, Award, Eye, Layers } from "lucide-react";

const GOLD = "hsl(43 74% 49%)";
const GOLD_LIGHT = "hsl(43 74% 70%)";

const quickFacts = [
  { value: "63", label: "Complications", icon: "⚙️" },
  { value: "2,877", label: "Components", icon: "🔩" },
  { value: "8 Years", label: "Development", icon: "📅" },
  { value: "Double-Sided", label: "Dial Design", icon: "💎" },
  { value: "Chinese", label: "Perpetual Calendar", icon: "🌙" },
  { value: "Westminster", label: "Minute Repeater", icon: "🔔" },
  { value: "11", label: "Astronomical Complications", icon: "⭐" },
  { value: "1755", label: "Year Founded", icon: "🏛️" },
];

const dialFeatures = [
  {
    id: "perpetual",
    label: "Perpetual Calendar",
    angle: 30,
    description: "An advanced mechanical system that automatically accounts for months of different lengths, including leap years — with no manual correction needed until 2100."
  },
  {
    id: "chinese",
    label: "Chinese Lunisolar Calendar",
    angle: 90,
    description: "A world-first complication that displays the traditional Chinese lunisolar calendar, including the 12 zodiac animals, leap months, and Chinese New Year dates."
  },
  {
    id: "moonphase",
    label: "Moon Phases",
    angle: 150,
    description: "Ultra-precise moon phase display accurate to within one day every 1,058 years. Displays both northern and southern hemisphere perspectives."
  },
  {
    id: "sunrise",
    label: "Sunrise & Sunset",
    angle: 210,
    description: "Displays precise sunrise and sunset times for any given location on Earth, calculated mechanically using geographic coordinates encoded at manufacture."
  },
  {
    id: "equation",
    label: "Equation of Time",
    angle: 270,
    description: "Shows the difference between civil time and apparent solar time — a difference that varies up to ±16 minutes throughout the year due to Earth's elliptical orbit."
  },
  {
    id: "sidereal",
    label: "Sidereal Time",
    angle: 330,
    description: "Displays time based on Earth's rotation relative to distant stars rather than the Sun — essential for astronomical observations and navigation."
  },
];

const backDialFeatures = [
  {
    id: "starchart",
    label: "Star Chart",
    angle: 45,
    description: "A rotating celestial map showing the stars visible from a specific latitude, with the sky rotating at the correct astronomical rate."
  },
  {
    id: "zodiac",
    label: "Zodiac Display",
    angle: 135,
    description: "Shows the Sun's position within the 12 zodiac constellations as it progresses through its annual journey across the ecliptic."
  },
  {
    id: "westminster",
    label: "Westminster Repeater",
    angle: 225,
    description: "On demand, the watch chimes the iconic Westminster melody on four gongs — the same sequence as Big Ben — indicating hours, quarter hours, and minutes."
  },
  {
    id: "tourbillon",
    label: "Tourbillon",
    angle: 315,
    description: "A rotating escapement cage that continuously rotates the entire balance wheel assembly to counteract the effects of gravity on timekeeping precision."
  },
];

const complicationGroups = [
  {
    title: "Astronomical Functions",
    icon: "🌌",
    color: "from-indigo-900/50 to-purple-900/50",
    border: "border-indigo-500/30",
    items: [
      "Sky chart with stellar positions",
      "Zodiac constellation display",
      "Sidereal time",
      "Solar time",
      "Equation of time",
      "Sunrise and sunset times",
      "Seasons and solstices",
      "Orbital indicators",
      "Celestial equator reference",
      "Ecliptic plane indicator",
      "Lunar nodes display",
    ]
  },
  {
    title: "Calendar Functions",
    icon: "📅",
    color: "from-amber-900/50 to-yellow-900/50",
    border: "border-amber-500/30",
    items: [
      "Gregorian perpetual calendar",
      "Chinese perpetual calendar",
      "Leap year cycle indicator",
      "Lunar month display",
      "Chinese zodiac animals",
      "Chinese New Year date",
      "Intercalary month indicator",
      "Day and date display",
      "Month indicator",
      "Four-digit year display",
      "Season indicator",
    ]
  },
  {
    title: "Acoustic Complications",
    icon: "🔔",
    color: "from-rose-900/50 to-pink-900/50",
    border: "border-rose-500/30",
    items: [
      "Westminster minute repeater",
      "Four-gong chime mechanism",
      "Hours chime",
      "Quarter-hour chime",
      "Minute-precision chime",
      "Adjustable strike on demand",
    ]
  },
  {
    title: "Precision Mechanisms",
    icon: "⚙️",
    color: "from-slate-800/50 to-zinc-800/50",
    border: "border-slate-400/30",
    items: [
      "Flying tourbillon regulator",
      "High-precision balance wheel",
      "Variable inertia regulation",
      "Anti-shock protection",
      "Dual mainspring barrels",
      "72-hour power reserve",
    ]
  },
];

const comparisonWatches = [
  { name: "Patek Philippe Calibre 89", year: 1989, complications: 33, note: "Held world record for 25 years" },
  { name: "Vacheron Constantin Reference 57260", year: 2015, complications: 57, note: "Previous Vacheron record" },
  { name: "Patek Philippe Grandmaster Chime", year: 2014, complications: 20, note: "Most complicated Patek wristwatch" },
  { name: "Berkley Grand Complication", year: 2015, complications: 63, note: "Current world record holder ✦" },
];

const craftSteps = [
  { step: "01", title: "Les Cabinotiers Atelier", desc: "A team of master watchmakers and artisans in Geneva's most exclusive atelier dedicate years to a single timepiece." },
  { step: "02", title: "Hand Engraving", desc: "Every surface is engraved by hand using traditional gravers — thousands of cuts to create intricate patterns and decorations." },
  { step: "03", title: "Côtes de Genève Finishing", desc: "Each component receives the iconic Geneva stripes — parallel lines polished to mirror perfection under magnification." },
  { step: "04", title: "Beveling & Anglage", desc: "Every edge and chamfer is hand-polished at 45° creating the signature shimmering aesthetic of fine Swiss horology." },
  { step: "05", title: "Hand Assembly", desc: "2,877 individual components assembled without automation — each fit adjusted by hand with tolerances measured in microns." },
  { step: "06", title: "Final Regulation", desc: "The completed movement is regulated over weeks in multiple positions, temperatures, and orientations for maximum accuracy." },
];

function WatchDialSVG({ features, label }: { features: typeof dialFeatures; label: string }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const selectedFeature = features.find(f => f.id === selected);

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-xs uppercase tracking-widest" style={{ color: GOLD_LIGHT }}>{label}</p>
      <div className="relative" style={{ width: 280, height: 280 }}>
        {/* Outer ring */}
        <svg width={280} height={280} viewBox="0 0 280 280" className="absolute inset-0">
          <defs>
            <radialGradient id={`grad-${label}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(215 28% 18%)" />
              <stop offset="100%" stopColor="hsl(215 28% 10%)" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Case */}
          <circle cx={140} cy={140} r={135} fill="none" stroke="hsl(43 74% 40%)" strokeWidth={3} />
          <circle cx={140} cy={140} r={130} fill={`url(#grad-${label})`} />
          {/* Minute track */}
          {Array.from({ length: 60 }).map((_, i) => {
            const a = (i * 6 - 90) * (Math.PI / 180);
            const r1 = i % 5 === 0 ? 118 : 122;
            const r2 = 128;
            return (
              <line
                key={i}
                x1={140 + r1 * Math.cos(a)}
                y1={140 + r1 * Math.sin(a)}
                x2={140 + r2 * Math.cos(a)}
                y2={140 + r2 * Math.sin(a)}
                stroke={i % 5 === 0 ? "hsl(43 74% 60%)" : "hsl(43 74% 35%)"}
                strokeWidth={i % 5 === 0 ? 1.5 : 0.8}
              />
            );
          })}
          {/* Inner decorative rings */}
          <circle cx={140} cy={140} r={108} fill="none" stroke="hsl(43 74% 30%)" strokeWidth={0.5} />
          <circle cx={140} cy={140} r={80} fill="none" stroke="hsl(43 74% 25%)" strokeWidth={0.5} />
          {/* Center dot */}
          <circle cx={140} cy={140} r={4} fill="hsl(43 74% 60%)" />
          {/* Hands */}
          <line x1={140} y1={140} x2={140} y2={70} stroke="hsl(43 74% 70%)" strokeWidth={2} strokeLinecap="round" filter="url(#glow)" />
          <line x1={140} y1={140} x2={185} y2={155} stroke="hsl(0 0% 90%)" strokeWidth={1.5} strokeLinecap="round" />
          {/* Feature hotspots */}
          {features.map(f => {
            const a = (f.angle - 90) * (Math.PI / 180);
            const r = 90;
            const cx = 140 + r * Math.cos(a);
            const cy = 140 + r * Math.sin(a);
            const isActive = hovered === f.id || selected === f.id;
            return (
              <g key={f.id}
                onMouseEnter={() => setHovered(f.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(selected === f.id ? null : f.id)}
                style={{ cursor: "pointer" }}
              >
                <circle cx={cx} cy={cy} r={isActive ? 10 : 7}
                  fill={isActive ? "hsl(43 74% 49%)" : "hsl(43 74% 20%)"}
                  stroke="hsl(43 74% 60%)" strokeWidth={1.5}
                  style={{ transition: "all 0.2s" }}
                />
                {isActive && (
                  <circle cx={cx} cy={cy} r={14}
                    fill="none" stroke="hsl(43 74% 49%)" strokeWidth={1}
                    opacity={0.5}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>
      {/* Info panel */}
      <div className="w-full min-h-[80px] rounded-xl border p-4 transition-all duration-300"
        style={{
          background: "hsl(215 28% 14% / 0.8)",
          borderColor: selected ? "hsl(43 74% 40%)" : "hsl(215 28% 22%)",
          backdropFilter: "blur(10px)"
        }}>
        {selectedFeature ? (
          <div className="animate-fade-in">
            <p className="text-sm font-semibold mb-1" style={{ color: GOLD }}>{selectedFeature.label}</p>
            <p className="text-xs leading-relaxed" style={{ color: "hsl(210 20% 75%)" }}>{selectedFeature.description}</p>
          </div>
        ) : (
          <p className="text-xs text-center" style={{ color: "hsl(215 16% 50%)" }}>
            Tap a golden dot to explore a complication
          </p>
        )}
      </div>
    </div>
  );
}

function ComplicationGroup({ group, index }: { group: typeof complicationGroups[0]; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all duration-300 ${group.border}`}
      style={{ background: "hsl(215 28% 12% / 0.7)", backdropFilter: "blur(20px)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 gap-4"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{group.icon}</span>
          <div className="text-left">
            <p className="font-semibold text-sm" style={{ color: GOLD }}>{group.title}</p>
            <p className="text-xs" style={{ color: "hsl(215 16% 55%)" }}>{group.items.length} complications</p>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: GOLD_LIGHT }} />
               : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: GOLD_LIGHT }} />}
      </button>
      {open && (
        <div className={`px-5 pb-5 animate-fade-in bg-gradient-to-b ${group.color} pt-2`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {group.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: GOLD }} />
                <span className="text-xs" style={{ color: "hsl(210 20% 80%)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Animated rotating watch crown SVG
function WatchHero() {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(r => (r + 0.3) % 360);
    }, 16);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 320, height: 320 }}>
      {/* Glow */}
      <div className="absolute inset-0 rounded-full blur-3xl opacity-30"
        style={{ background: "radial-gradient(circle, hsl(43 74% 49%), transparent 70%)" }} />
      <svg width={300} height={300} viewBox="0 0 300 300">
        <defs>
          <radialGradient id="caseGrad" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="hsl(43 30% 55%)" />
            <stop offset="40%" stopColor="hsl(43 60% 35%)" />
            <stop offset="100%" stopColor="hsl(43 40% 15%)" />
          </radialGradient>
          <radialGradient id="dialGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(215 28% 20%)" />
            <stop offset="100%" stopColor="hsl(215 28% 8%)" />
          </radialGradient>
          <filter id="heroGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Case shadow */}
        <ellipse cx={150} cy={158} rx={128} ry={133} fill="hsl(0 0% 0% / 0.4)" />
        {/* Case body */}
        <circle cx={150} cy={150} r={130} fill="url(#caseGrad)" />
        {/* Case bezel */}
        <circle cx={150} cy={150} r={128} fill="none" stroke="hsl(43 74% 55%)" strokeWidth={3} />
        <circle cx={150} cy={150} r={122} fill="none" stroke="hsl(43 74% 30%)" strokeWidth={1} />
        {/* Dial */}
        <circle cx={150} cy={150} r={115} fill="url(#dialGrad)" />
        {/* Minute track */}
        {Array.from({ length: 60 }).map((_, i) => {
          const a = ((i * 6) - 90) * Math.PI / 180;
          const r1 = i % 5 === 0 ? 103 : 107;
          return (
            <line key={i}
              x1={150 + r1 * Math.cos(a)} y1={150 + r1 * Math.sin(a)}
              x2={150 + 112 * Math.cos(a)} y2={150 + 112 * Math.sin(a)}
              stroke={i % 5 === 0 ? "hsl(43 74% 65%)" : "hsl(43 74% 35%)"}
              strokeWidth={i % 5 === 0 ? 2 : 0.8}
            />
          );
        })}
        {/* Sub-dials */}
        <circle cx={150} cy={110} r={18} fill="hsl(215 28% 14%)" stroke="hsl(43 74% 40%)" strokeWidth={1} />
        <circle cx={105} cy={165} r={14} fill="hsl(215 28% 14%)" stroke="hsl(43 74% 40%)" strokeWidth={1} />
        <circle cx={195} cy={165} r={14} fill="hsl(215 28% 14%)" stroke="hsl(43 74% 40%)" strokeWidth={1} />
        <circle cx={150} cy={185} r={16} fill="hsl(215 28% 14%)" stroke="hsl(43 74% 40%)" strokeWidth={1} />
        {/* Rotating hour hand */}
        <g transform={`rotate(${rotation}, 150, 150)`}>
          <line x1={150} y1={150} x2={150} y2={82}
            stroke="hsl(43 74% 70%)" strokeWidth={3} strokeLinecap="round"
            filter="url(#heroGlow)" />
        </g>
        {/* Rotating minute hand */}
        <g transform={`rotate(${rotation * 12 % 360}, 150, 150)`}>
          <line x1={150} y1={150} x2={150} y2={68}
            stroke="hsl(0 0% 95%)" strokeWidth={2} strokeLinecap="round" />
        </g>
        {/* Second hand */}
        <g transform={`rotate(${rotation * 60 % 360}, 150, 150)`}>
          <line x1={150} y1={150} x2={150} y2={60}
            stroke="hsl(0 84% 60%)" strokeWidth={1} strokeLinecap="round" />
          <circle cx={150} cy={150} r={4} fill="hsl(0 84% 60%)" />
        </g>
        {/* Crown */}
        <rect x={278} y={143} width={14} height={14} rx={3}
          fill="hsl(43 74% 45%)" stroke="hsl(43 74% 60%)" strokeWidth={1} />
        {/* Lugs */}
        <rect x={128} y={22} width={44} height={16} rx={5} fill="hsl(43 50% 35%)" />
        <rect x={128} y={262} width={44} height={16} rx={5} fill="hsl(43 50% 35%)" />
      </svg>
    </div>
  );
}

export default function WatchShowcase() {
  const sectionsRef = useRef<HTMLDivElement[]>([]);
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-idx"));
            setVisibleSections(prev => new Set([...prev, idx]));
          }
        });
      },
      { threshold: 0.1 }
    );
    sectionsRef.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const setRef = (idx: number) => (el: HTMLDivElement | null) => {
    if (el) sectionsRef.current[idx] = el;
  };

  const sectionStyle = (idx: number) => ({
    opacity: visibleSections.has(idx) ? 1 : 0,
    transform: visibleSections.has(idx) ? "translateY(0)" : "translateY(30px)",
    transition: "opacity 0.7s ease, transform 0.7s ease",
  });

  return (
    <Layout showFab={false}>
      <div style={{ background: "hsl(220 25% 7%)", minHeight: "100vh", color: "hsl(210 20% 90%)" }}>

        {/* HERO */}
        <section className="relative flex flex-col items-center justify-center text-center px-4 py-20 overflow-hidden min-h-screen">
          {/* Background texture */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(43 74% 49%) 1px, transparent 0)", backgroundSize: "30px 30px" }} />
          {/* Gold vignette */}
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at center, hsl(43 74% 20% / 0.15) 0%, transparent 70%)" }} />

          <div className="relative z-10 flex flex-col items-center gap-8">
            <p className="text-xs uppercase tracking-[0.4em]" style={{ color: GOLD_LIGHT }}>
              Vacheron Constantin · Les Cabinotiers
            </p>
            <WatchHero />
            <div>
              <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-4 max-w-3xl"
                style={{ background: `linear-gradient(135deg, ${GOLD}, hsl(43 74% 80%), ${GOLD})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                The Berkley Grand Complication
              </h1>
              <p className="text-base sm:text-lg max-w-xl mx-auto" style={{ color: "hsl(210 20% 65%)" }}>
                The most complicated mechanical watch ever created by human hands.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-px w-12" style={{ background: GOLD }} />
              <span className="text-xs tracking-widest uppercase" style={{ color: GOLD_LIGHT }}>Geneva · 2015</span>
              <div className="h-px w-12" style={{ background: GOLD }} />
            </div>
          </div>
          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-50">
            <span className="text-xs" style={{ color: GOLD_LIGHT }}>Explore</span>
            <ChevronDown className="h-4 w-4 animate-bounce" style={{ color: GOLD_LIGHT }} />
          </div>
        </section>

        {/* QUICK FACTS */}
        <section ref={setRef(0)} data-idx={0} style={sectionStyle(0)} className="px-4 py-16 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: GOLD_LIGHT }}>At a Glance</p>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: GOLD }}>Key Specifications</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickFacts.map((fact, i) => (
              <div key={i} className="rounded-2xl p-5 text-center border transition-all duration-300 hover:scale-105"
                style={{
                  background: "hsl(215 28% 12% / 0.8)",
                  borderColor: "hsl(43 74% 30%)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 4px 24px hsl(43 74% 20% / 0.3)"
                }}>
                <div className="text-2xl mb-2">{fact.icon}</div>
                <div className="text-xl font-bold mb-1" style={{ color: GOLD }}>{fact.value}</div>
                <div className="text-xs" style={{ color: "hsl(215 16% 55%)" }}>{fact.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* DIAL EXPLORER */}
        <section ref={setRef(1)} data-idx={1} style={sectionStyle(1)} className="px-4 py-16 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: GOLD_LIGHT }}>Interactive</p>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: GOLD }}>Dial Explorer</h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: "hsl(210 20% 60%)" }}>
              Tap the golden hotspots on each dial to reveal the secrets of each complication.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
            <WatchDialSVG features={dialFeatures} label="Front Dial" />
            <WatchDialSVG features={backDialFeatures} label="Back Dial" />
          </div>
        </section>

        {/* COMPLICATION SHOWCASE */}
        <section ref={setRef(2)} data-idx={2} style={sectionStyle(2)} className="px-4 py-16 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: GOLD_LIGHT }}>63 Complications</p>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: GOLD }}>Complication Showcase</h2>
          </div>
          <div className="space-y-4">
            {complicationGroups.map((group, i) => (
              <ComplicationGroup key={i} group={group} index={i} />
            ))}
          </div>
        </section>

        {/* MICRO-MECHANICS */}
        <section ref={setRef(3)} data-idx={3} style={sectionStyle(3)} className="px-4 py-16 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: GOLD_LIGHT }}>Engineering</p>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: GOLD }}>Micro-Mechanics</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: "⚙️", title: "2,877 Components", desc: "Each gear, spring, jewel and lever is crafted to tolerances measured in microns — smaller than a human hair." },
              { icon: "🔬", title: "Hand-Finished Bridges", desc: "Every bridge and plate receives hours of hand-finishing: anglage, circular graining, polished slots, and chamfered edges." },
              { icon: "💎", title: "Sapphire Crystals", desc: "Anti-reflective sapphire crystals on both sides provide a window into the mechanical universe within, rated for scratch resistance." },
              { icon: "🏛️", title: "Engraved Plates", desc: "The movement plates feature hand-engraved floral motifs by Vacheron's master engravers — an art form taught over decades." },
              { icon: "🔩", title: "Gold Screws", desc: "18-karat gold screws with mirror-polished heads and blued steel screws provide contrast and precision throughout the movement." },
              { icon: "📐", title: "Multi-Layer Architecture", desc: "The movement's three-dimensional architecture stacks complications in multiple layers, requiring custom bridge geometry on each level." },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl p-6 border transition-all duration-300 hover:border-amber-500/50 hover:-translate-y-1"
                style={{ background: "hsl(215 28% 12% / 0.8)", borderColor: "hsl(43 74% 25%)", backdropFilter: "blur(20px)" }}>
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-sm mb-2" style={{ color: GOLD }}>{item.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "hsl(210 20% 62%)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CRAFTSMANSHIP */}
        <section ref={setRef(4)} data-idx={4} style={sectionStyle(4)} className="px-4 py-16 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: GOLD_LIGHT }}>The Atelier</p>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: GOLD }}>Craftsmanship Story</h2>
          </div>
          <div className="space-y-6">
            {craftSteps.map((step, i) => (
              <div key={i} className="flex gap-5 items-start p-5 rounded-2xl border"
                style={{ background: "hsl(215 28% 11% / 0.7)", borderColor: "hsl(43 74% 20%)", backdropFilter: "blur(10px)" }}>
                <div className="text-2xl font-bold shrink-0 w-10 text-right" style={{ color: "hsl(43 74% 35%)" }}>{step.step}</div>
                <div className="h-8 w-px shrink-0 mt-0.5" style={{ background: "hsl(43 74% 30%)" }} />
                <div>
                  <h3 className="font-semibold text-sm mb-1" style={{ color: GOLD }}>{step.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "hsl(210 20% 62%)" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* COMPARISON */}
        <section ref={setRef(5)} data-idx={5} style={sectionStyle(5)} className="px-4 py-16 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: GOLD_LIGHT }}>Historical Context</p>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: GOLD }}>World's Most Complicated Watches</h2>
          </div>
          <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "hsl(43 74% 25%)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "hsl(215 28% 15%)" }}>
                  <th className="text-left p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: GOLD_LIGHT }}>Watch</th>
                  <th className="text-center p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: GOLD_LIGHT }}>Year</th>
                  <th className="text-center p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: GOLD_LIGHT }}>Complications</th>
                  <th className="hidden sm:table-cell text-left p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: GOLD_LIGHT }}>Note</th>
                </tr>
              </thead>
              <tbody>
                {comparisonWatches.map((w, i) => (
                  <tr key={i} style={{
                    background: w.complications === 63 ? "hsl(43 74% 15% / 0.4)" : i % 2 === 0 ? "hsl(215 28% 12%)" : "hsl(215 28% 10%)",
                    borderTop: "1px solid hsl(43 74% 15%)"
                  }}>
                    <td className="p-4 font-medium text-sm" style={{ color: w.complications === 63 ? GOLD : "hsl(210 20% 80%)" }}>{w.name}</td>
                    <td className="p-4 text-center text-sm" style={{ color: "hsl(215 16% 60%)" }}>{w.year}</td>
                    <td className="p-4 text-center">
                      <span className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: w.complications === 63 ? "hsl(43 74% 25%)" : "hsl(215 28% 20%)",
                          color: w.complications === 63 ? GOLD : "hsl(215 16% 60%)"
                        }}>
                        {w.complications}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell p-4 text-xs" style={{ color: w.complications === 63 ? "hsl(43 74% 70%)" : "hsl(215 16% 55%)" }}>{w.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* GALLERY */}
        <section ref={setRef(6)} data-idx={6} style={sectionStyle(6)} className="px-4 py-16 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: GOLD_LIGHT }}>Visual Gallery</p>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: GOLD }}>A Study in Detail</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Movement", emoji: "⚙️", bg: "from-zinc-900 to-zinc-800" },
              { label: "Dial Engraving", emoji: "🏛️", bg: "from-amber-950 to-amber-900" },
              { label: "Gold Case", emoji: "💛", bg: "from-yellow-950 to-yellow-900" },
              { label: "Mechanical Layers", emoji: "🔬", bg: "from-slate-900 to-slate-800" },
              { label: "Tourbillon Cage", emoji: "🌀", bg: "from-indigo-950 to-indigo-900" },
              { label: "Repeater Gongs", emoji: "🔔", bg: "from-orange-950 to-orange-900" },
              { label: "Sapphire Crystal", emoji: "💎", bg: "from-blue-950 to-blue-900" },
              { label: "Crown Detail", emoji: "👑", bg: "from-rose-950 to-rose-900" },
            ].map((item, i) => (
              <div key={i}
                className={`aspect-square rounded-2xl bg-gradient-to-br ${item.bg} border flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer`}
                style={{ borderColor: "hsl(43 74% 25%)", boxShadow: "0 4px 20px hsl(0 0% 0% / 0.4)" }}>
                <div className="text-4xl">{item.emoji}</div>
                <p className="text-xs font-medium text-center px-2" style={{ color: "hsl(43 74% 60%)" }}>{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* LEGACY */}
        <section ref={setRef(7)} data-idx={7} style={sectionStyle(7)} className="px-4 py-16 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: GOLD_LIGHT }}>Since 1755</p>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: GOLD }}>The Legacy of Vacheron Constantin</h2>
          </div>
          <div className="rounded-2xl border p-8 text-center"
            style={{ background: "hsl(215 28% 11% / 0.8)", borderColor: "hsl(43 74% 25%)", backdropFilter: "blur(20px)" }}>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "hsl(210 20% 70%)" }}>
              Founded in Geneva in 1755, Vacheron Constantin is the world's oldest watch manufacturer in continuous operation. 
              For nearly three centuries, the Maison has upheld an unbroken tradition of horological excellence, attracting 
              kings, emperors, and collectors.
            </p>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "hsl(210 20% 70%)" }}>
              The <span style={{ color: GOLD }}>Les Cabinotiers</span> division — named after the 18th-century watchmakers who 
              worked in elevated workshops to capture natural light — creates exclusively bespoke timepieces. Each watch is 
              a singular commission, developed in close collaboration with the collector over years.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "hsl(210 20% 70%)" }}>
              The Berkley Grand Complication represents the summit of this tradition — eight years of work, 
              three master watchmakers, and a singular vision: to push human achievement in mechanical watchmaking 
              beyond all previous limits.
            </p>
          </div>
        </section>

        {/* FINAL */}
        <section ref={setRef(8)} data-idx={8} style={sectionStyle(8)} className="px-4 py-24 text-center relative overflow-hidden">
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at center, hsl(43 74% 15% / 0.2) 0%, transparent 70%)" }} />
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-px flex-1 max-w-8" style={{ background: GOLD }} />
              ))}
              <span className="text-2xl">✦</span>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-px flex-1 max-w-8" style={{ background: GOLD }} />
              ))}
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold italic leading-tight"
              style={{ background: `linear-gradient(135deg, ${GOLD}, hsl(43 74% 85%), ${GOLD})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              "A masterpiece of time, astronomy, and human craftsmanship."
            </h2>
            <p className="mt-6 text-xs uppercase tracking-widest" style={{ color: "hsl(43 74% 45%)" }}>
              Vacheron Constantin · Les Cabinotiers · Geneva · Since 1755
            </p>
          </div>
        </section>

      </div>
    </Layout>
  );
}
