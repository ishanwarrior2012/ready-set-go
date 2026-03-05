import { useState, useEffect, useRef, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";

// ─── ASTRONOMICAL CALCULATIONS ───────────────────────────────────────────────

function toRad(deg: number) { return deg * Math.PI / 180; }
function toDeg(rad: number) { return rad * 180 / Math.PI; }

function julianDay(date: Date): number {
  const a = Math.floor((14 - (date.getMonth() + 1)) / 12);
  const y = date.getFullYear() + 4800 - a;
  const m = (date.getMonth() + 1) + 12 * a - 3;
  return date.getDate()
    + Math.floor((153 * m + 2) / 5)
    + 365 * y
    + Math.floor(y / 4)
    - Math.floor(y / 100)
    + Math.floor(y / 400)
    - 32045
    + (date.getHours() - 12) / 24
    + date.getMinutes() / 1440
    + date.getSeconds() / 86400;
}

function moonPhase(date: Date): { phase: number; name: string; age: number; illumination: number } {
  const jd = julianDay(date);
  const newMoon2000 = 2451549.5;
  const synodicMonth = 29.53058867;
  const daysSince = jd - newMoon2000;
  const phase = ((daysSince % synodicMonth) + synodicMonth) % synodicMonth;
  const illumination = 0.5 * (1 - Math.cos(2 * Math.PI * phase / synodicMonth));
  const names = ["New Moon","Waxing Crescent","First Quarter","Waxing Gibbous","Full Moon","Waning Gibbous","Last Quarter","Waning Crescent"];
  const idx = Math.floor((phase / synodicMonth) * 8) % 8;
  return { phase: phase / synodicMonth, name: names[idx], age: phase, illumination };
}

function equationOfTime(date: Date): number {
  const D = julianDay(date) - 2451545.0;
  const g = (357.529 + 0.98560028 * D) % 360;
  const q = (280.459 + 0.98564736 * D) % 360;
  const L = (q + 1.915 * Math.sin(toRad(g)) + 0.020 * Math.sin(toRad(2 * g))) % 360;
  const e = 23.439 - 0.0000004 * D;
  const RA = toDeg(Math.atan2(Math.cos(toRad(e)) * Math.sin(toRad(L)), Math.cos(toRad(L))));
  const EoT = q - 0.0057183 - RA + 1.915 * Math.sin(toRad(g)) * 0 + 0.020 * 0; // simplified
  return ((q - RA + 180) % 360 - 180) * 4; // in minutes
}

function siderealTime(date: Date, longitude = 0): number {
  const jd = julianDay(date);
  const T = (jd - 2451545.0) / 36525;
  const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T - T * T * T / 38710000;
  return ((gmst + longitude) % 360 + 360) % 360;
}

function sunPosition(date: Date): { altitude: number; azimuth: number; declination: number; rightAscension: number } {
  const D = julianDay(date) - 2451545.0;
  const g = toRad((357.529 + 0.98560028 * D) % 360);
  const q = toRad((280.459 + 0.98564736 * D) % 360);
  const L = toRad((toDeg(q) + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) % 360);
  const e = toRad(23.439 - 0.0000004 * D);
  const declination = Math.asin(Math.sin(e) * Math.sin(L));
  const rightAscension = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  const lat = toRad(40.7128); // Default lat (NY)
  const ha = toRad(siderealTime(date)) - rightAscension;
  const altitude = Math.asin(Math.sin(lat) * Math.sin(declination) + Math.cos(lat) * Math.cos(declination) * Math.cos(ha));
  const azimuth = Math.atan2(-Math.sin(ha), Math.tan(declination) * Math.cos(lat) - Math.sin(lat) * Math.cos(ha));
  return { altitude: toDeg(altitude), azimuth: (toDeg(azimuth) + 360) % 360, declination: toDeg(declination), rightAscension: toDeg(rightAscension) };
}

function getSunriseSunset(date: Date, lat = 40.7128, lng = -74.006): { sunrise: Date; sunset: Date; daylength: number } {
  const jd = julianDay(date);
  const n = jd - 2451545.0 + 0.0008;
  const Js = n - lng / 360;
  const M = toRad((357.5291 + 0.98560028 * Js) % 360);
  const C = 1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M);
  const λ = toRad((toDeg(M) + C + 180 + 102.9372) % 360);
  const Jtransit = 2451545.0 + Js + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * λ);
  const δ = Math.asin(Math.sin(λ) * Math.sin(toRad(23.44)));
  const cosω = (Math.sin(toRad(-0.83)) - Math.sin(toRad(lat)) * Math.sin(δ)) / (Math.cos(toRad(lat)) * Math.cos(δ));
  const ω = Math.acos(Math.max(-1, Math.min(1, cosω)));
  const Jrise = Jtransit - toDeg(ω) / 360;
  const Jset = Jtransit + toDeg(ω) / 360;
  const toDate = (jd: number) => new Date((jd - 2440587.5) * 86400000);
  const sunrise = toDate(Jrise);
  const sunset = toDate(Jset);
  const daylength = (Jset - Jrise) * 24;
  return { sunrise, sunset, daylength };
}

function getSeason(date: Date): { name: string; progress: number; icon: string; color: string } {
  const month = date.getMonth();
  const day = date.getDate();
  // Northern hemisphere
  if ((month === 2 && day >= 20) || month === 3 || month === 4 || (month === 5 && day < 21))
    return { name: "Spring", progress: ((month - 2) * 30 + day) / 92, icon: "🌸", color: "hsl(320 60% 60%)" };
  if ((month === 5 && day >= 21) || month === 6 || month === 7 || (month === 8 && day < 23))
    return { name: "Summer", progress: ((month - 5) * 30 + day - 21) / 92, icon: "☀️", color: "hsl(43 74% 55%)" };
  if ((month === 8 && day >= 23) || month === 9 || month === 10 || (month === 11 && day < 21))
    return { name: "Autumn", progress: ((month - 8) * 30 + day - 23) / 91, icon: "🍂", color: "hsl(25 80% 50%)" };
  return { name: "Winter", progress: ((month < 2 ? month + 1 : 0) * 30 + day) / 89, icon: "❄️", color: "hsl(200 60% 60%)" };
}

function getChineseLunisolar(date: Date): { year: number; animal: string; element: string; monthName: string; dayNum: number; isLeapMonth: boolean } {
  const animals = ["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"];
  const elements = ["Wood","Wood","Fire","Fire","Earth","Earth","Metal","Metal","Water","Water"];
  const months = ["正月","二月","三月","四月","五月","六月","七月","八月","九月","十月","冬月","腊月"];
  // Simplified calculation - approximate Chinese year
  const year = date.getFullYear();
  const chineseYear = year - 1900 + (date.getMonth() >= 1 ? 1 : 0);
  const animal = animals[((year - 2020) % 12 + 12) % 12];
  const element = elements[((year - 2020) % 10 + 10) % 10];
  // Approximate lunar day (29.53 days per lunar month)
  const jd = julianDay(date);
  const lunarDay = Math.floor(((jd - 2451549.5) % 29.53058867 + 29.53058867) % 29.53058867) + 1;
  const lunarMonth = Math.floor(((jd - 2451549.5) / 29.53058867 + 0.5) % 12);
  return { year: chineseYear, animal, element, monthName: months[Math.abs(lunarMonth) % 12], dayNum: lunarDay, isLeapMonth: false };
}

function getZodiac(date: Date): { sign: string; symbol: string; element: string; startDate: string } {
  const signs = [
    { sign: "Capricorn", symbol: "♑", element: "Earth", startDate: "Dec 22" },
    { sign: "Aquarius", symbol: "♒", element: "Air", startDate: "Jan 20" },
    { sign: "Pisces", symbol: "♓", element: "Water", startDate: "Feb 19" },
    { sign: "Aries", symbol: "♈", element: "Fire", startDate: "Mar 21" },
    { sign: "Taurus", symbol: "♉", element: "Earth", startDate: "Apr 20" },
    { sign: "Gemini", symbol: "♊", element: "Air", startDate: "May 21" },
    { sign: "Cancer", symbol: "♋", element: "Water", startDate: "Jun 21" },
    { sign: "Leo", symbol: "♌", element: "Fire", startDate: "Jul 23" },
    { sign: "Virgo", symbol: "♍", element: "Earth", startDate: "Aug 23" },
    { sign: "Libra", symbol: "♎", element: "Air", startDate: "Sep 23" },
    { sign: "Scorpio", symbol: "♏", element: "Water", startDate: "Oct 23" },
    { sign: "Sagittarius", symbol: "♐", element: "Fire", startDate: "Nov 22" },
  ];
  const m = date.getMonth() + 1, d = date.getDate();
  if ((m === 12 && d >= 22) || (m === 1 && d < 20)) return signs[0];
  if ((m === 1 && d >= 20) || (m === 2 && d < 19)) return signs[1];
  if ((m === 2 && d >= 19) || (m === 3 && d < 21)) return signs[2];
  if ((m === 3 && d >= 21) || (m === 4 && d < 20)) return signs[3];
  if ((m === 4 && d >= 20) || (m === 5 && d < 21)) return signs[4];
  if ((m === 5 && d >= 21) || (m === 6 && d < 21)) return signs[5];
  if ((m === 6 && d >= 21) || (m === 7 && d < 23)) return signs[6];
  if ((m === 7 && d >= 23) || (m === 8 && d < 23)) return signs[7];
  if ((m === 8 && d >= 23) || (m === 9 && d < 23)) return signs[8];
  if ((m === 9 && d >= 23) || (m === 10 && d < 23)) return signs[9];
  if ((m === 10 && d >= 23) || (m === 11 && d < 22)) return signs[10];
  return signs[11];
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getLeapYearInfo(year: number): { current: boolean; last: number; next: number; cyclePos: number } {
  let last = year - 1;
  while (!isLeapYear(last)) last--;
  let next = year + 1;
  while (!isLeapYear(next)) next++;
  return { current: isLeapYear(year), last, next, cyclePos: (year - last) };
}

// ─── STAR DATA (simplified bright stars) ──────────────────────────────────
const STARS = [
  { name: "Sirius", ra: 101.3, dec: -16.7, mag: -1.46 },
  { name: "Canopus", ra: 95.9, dec: -52.7, mag: -0.72 },
  { name: "Arcturus", ra: 213.9, dec: 19.2, mag: -0.05 },
  { name: "Vega", ra: 279.2, dec: 38.8, mag: 0.03 },
  { name: "Capella", ra: 79.2, dec: 46.0, mag: 0.08 },
  { name: "Rigel", ra: 78.6, dec: -8.2, mag: 0.13 },
  { name: "Procyon", ra: 114.8, dec: 5.2, mag: 0.34 },
  { name: "Betelgeuse", ra: 88.8, dec: 7.4, mag: 0.42 },
  { name: "Altair", ra: 297.7, dec: 8.9, mag: 0.77 },
  { name: "Aldebaran", ra: 68.9, dec: 16.5, mag: 0.85 },
  { name: "Spica", ra: 201.3, dec: -11.2, mag: 0.97 },
  { name: "Antares", ra: 247.4, dec: -26.4, mag: 1.06 },
  { name: "Pollux", ra: 116.3, dec: 28.0, mag: 1.14 },
  { name: "Fomalhaut", ra: 344.4, dec: -29.6, mag: 1.16 },
  { name: "Deneb", ra: 310.4, dec: 45.3, mag: 1.25 },
  { name: "Regulus", ra: 152.1, dec: 11.97, mag: 1.35 },
  { name: "Castor", ra: 113.6, dec: 31.9, mag: 1.58 },
  { name: "Bellatrix", ra: 81.3, dec: 6.35, mag: 1.64 },
  { name: "Elnath", ra: 81.6, dec: 28.6, mag: 1.65 },
  { name: "Mimosa", ra: 191.9, dec: -59.7, mag: 1.25 },
  { name: "Alnilam", ra: 84.1, dec: -1.2, mag: 1.70 },
  { name: "Alnitak", ra: 85.2, dec: -1.94, mag: 1.77 },
  { name: "Dubhe", ra: 165.9, dec: 61.75, mag: 1.79 },
  { name: "Mirfak", ra: 51.1, dec: 49.86, mag: 1.79 },
  { name: "Wezen", ra: 107.1, dec: -26.39, mag: 1.83 },
  { name: "Alioth", ra: 193.5, dec: 55.96, mag: 1.76 },
  { name: "Kaus Australis", ra: 276.0, dec: -34.38, mag: 1.79 },
  { name: "Avior", ra: 125.6, dec: -59.51, mag: 1.86 },
  { name: "Alkaid", ra: 206.9, dec: 49.31, mag: 1.85 },
  { name: "Sargas", ra: 264.3, dec: -42.99, mag: 1.86 },
];

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function GoldDivider() {
  return <div className="w-full h-px my-2" style={{ background: "linear-gradient(90deg, transparent, hsl(43 74% 49%), transparent)" }} />;
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold tracking-widest uppercase" style={{ color: "hsl(43 74% 55%)" }}>{children}</h2>
      {sub && <p className="text-sm mt-1" style={{ color: "hsl(43 74% 35%)" }}>{sub}</p>}
      <GoldDivider />
    </div>
  );
}

function DataCard({ title, value, sub, icon, accent }: { title: string; value: string; sub?: string; icon?: string; accent?: string }) {
  return (
    <div className="rounded-xl p-4 border relative overflow-hidden"
      style={{ background: "hsl(222 47% 6%)", borderColor: "hsl(43 74% 25%)", boxShadow: "0 0 20px hsl(43 74% 10%)" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 80% 20%, hsl(43 74% 20% / 0.15), transparent 60%)" }} />
      <div className="relative">
        {icon && <div className="text-2xl mb-2">{icon}</div>}
        <div className="text-xs uppercase tracking-widest mb-1" style={{ color: "hsl(43 74% 40%)" }}>{title}</div>
        <div className="text-xl font-bold" style={{ color: accent || "hsl(43 74% 65%)" }}>{value}</div>
        {sub && <div className="text-xs mt-1" style={{ color: "hsl(43 74% 35%)" }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── MOON PHASE SVG ──────────────────────────────────────────────────────────
function MoonPhaseSVG({ phase, illumination }: { phase: number; illumination: number }) {
  const size = 120;
  const r = 50;
  const cx = 60, cy = 60;
  // Phase: 0=new, 0.25=first quarter, 0.5=full, 0.75=last quarter
  const isWaxing = phase < 0.5;
  const angle = phase * 360;
  // Build path for illuminated portion
  let path = "";
  if (phase < 0.02 || phase > 0.98) {
    // New moon - dark circle
    path = `M ${cx} ${cy-r} A ${r} ${r} 0 1 1 ${cx} ${cy+r} A ${r} ${r} 0 1 1 ${cx} ${cy-r}`;
  } else if (Math.abs(phase - 0.5) < 0.02) {
    // Full moon
    path = `M ${cx} ${cy-r} A ${r} ${r} 0 1 1 ${cx} ${cy+r} A ${r} ${r} 0 1 1 ${cx} ${cy-r}`;
  } else {
    const xScale = Math.cos(phase * 2 * Math.PI);
    const rx = Math.abs(r * xScale);
    const sweep1 = isWaxing ? 0 : 1;
    const sweep2 = isWaxing ? 1 : 0;
    path = `M ${cx} ${cy-r} A ${rx} ${r} 0 0 ${sweep1} ${cx} ${cy+r} A ${r} ${r} 0 0 ${sweep2} ${cx} ${cy-r}`;
  }
  const moonFill = (phase < 0.02 || phase > 0.98) ? "hsl(222 20% 12%)" : "hsl(43 50% 85%)";
  const darkFill = "hsl(222 20% 10%)";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="moonGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="hsl(43 50% 95%)" />
          <stop offset="100%" stopColor="hsl(43 30% 70%)" />
        </radialGradient>
        <filter id="moonFilter">
          <feGaussianBlur stdDeviation="1" />
        </filter>
      </defs>
      {/* Dark circle (night side) */}
      <circle cx={cx} cy={cy} r={r} fill={darkFill} stroke="hsl(43 20% 30%)" strokeWidth="1" />
      {/* Illuminated portion */}
      {phase > 0.02 && phase < 0.98 && (
        <path d={path} fill="url(#moonGlow)" />
      )}
      {(phase < 0.02 || phase > 0.98) && phase < 0.5 && (
        <circle cx={cx} cy={cy} r={r} fill={darkFill} />
      )}
      {(Math.abs(phase - 0.5) < 0.02) && (
        <circle cx={cx} cy={cy} r={r} fill="url(#moonGlow)" />
      )}
      {/* Subtle craters */}
      <circle cx={cx+15} cy={cy-10} r={4} fill="none" stroke="hsl(43 20% 75%)" strokeWidth="0.5" opacity="0.4" />
      <circle cx={cx-20} cy={cy+15} r={6} fill="none" stroke="hsl(43 20% 75%)" strokeWidth="0.5" opacity="0.3" />
      <circle cx={cx+5} cy={cy+20} r={3} fill="none" stroke="hsl(43 20% 75%)" strokeWidth="0.5" opacity="0.35" />
    </svg>
  );
}

// ─── STAR CHART SVG ──────────────────────────────────────────────────────────
function StarChartSVG({ siderealDeg }: { siderealDeg: number }) {
  const size = 280;
  const cx = size / 2, cy = size / 2;
  const radius = size / 2 - 10;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      <defs>
        <radialGradient id="skyGrad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="hsl(230 40% 12%)" />
          <stop offset="100%" stopColor="hsl(222 50% 4%)" />
        </radialGradient>
        <clipPath id="skyClip">
          <circle cx={cx} cy={cy} r={radius} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={radius} fill="url(#skyGrad)" stroke="hsl(43 74% 30%)" strokeWidth="1.5" />
      {/* Horizon circles */}
      {[0.3, 0.6, 0.9].map(f => (
        <circle key={f} cx={cx} cy={cy} r={radius * f} fill="none" stroke="hsl(43 74% 20%)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.5" />
      ))}
      {/* Cardinal lines */}
      <line x1={cx} y1={10} x2={cx} y2={size-10} stroke="hsl(43 74% 25%)" strokeWidth="0.5" opacity="0.4" />
      <line x1={10} y1={cy} x2={size-10} y2={cy} stroke="hsl(43 74% 25%)" strokeWidth="0.5" opacity="0.4" />
      <text x={cx} y={18} textAnchor="middle" fill="hsl(43 74% 50%)" fontSize="9" fontWeight="bold">N</text>
      <text x={size-8} y={cy+4} textAnchor="middle" fill="hsl(43 74% 50%)" fontSize="9" fontWeight="bold">E</text>
      <text x={cx} y={size-4} textAnchor="middle" fill="hsl(43 74% 50%)" fontSize="9" fontWeight="bold">S</text>
      <text x={8} y={cy+4} textAnchor="middle" fill="hsl(43 74% 50%)" fontSize="9" fontWeight="bold">W</text>
      {/* Stars */}
      <g clipPath="url(#skyClip)">
        {STARS.map((star) => {
          // Project RA/Dec to screen coords using sidereal rotation
          const raAdj = ((star.ra - siderealDeg) % 360 + 360) % 360;
          const raRad = toRad(raAdj - 180);
          const decRad = toRad(star.dec);
          const projR = radius * (90 - star.dec) / 90;
          const x = cx + projR * Math.sin(raRad + Math.PI);
          const y = cy - projR * Math.cos(raRad + Math.PI) * 0.7;
          const starR = Math.max(0.8, 3 - star.mag * 1.2);
          const brightness = Math.max(0.3, 1 - star.mag * 0.3);
          if (x < 0 || x > size || y < 0 || y > size) return null;
          return (
            <g key={star.name}>
              <circle cx={x} cy={y} r={starR + 2} fill={`hsl(43 74% 70% / ${brightness * 0.2})`} />
              <circle cx={x} cy={y} r={starR} fill={`hsl(43 74% 90% / ${brightness})`} />
              {star.mag < 0.5 && (
                <text x={x + 5} y={y + 3} fill="hsl(43 74% 60%)" fontSize="7" opacity="0.7">{star.name}</text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ─── TOURBILLON SVG ──────────────────────────────────────────────────────────
function TourbillonSVG({ angle }: { angle: number }) {
  const r = 50;
  return (
    <svg width={120} height={120} viewBox="-60 -60 120 120">
      <defs>
        <radialGradient id="tGrad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="hsl(43 74% 35%)" />
          <stop offset="100%" stopColor="hsl(43 74% 15%)" />
        </radialGradient>
      </defs>
      {/* Outer cage */}
      <circle r={r} fill="url(#tGrad)" stroke="hsl(43 74% 50%)" strokeWidth="1.5" />
      {/* Rotating cage */}
      <g transform={`rotate(${angle})`}>
        {/* Cage spokes */}
        {[0, 60, 120, 180, 240, 300].map(a => (
          <line key={a} x1={0} y1={0} x2={r * 0.8 * Math.cos(toRad(a))} y2={r * 0.8 * Math.sin(toRad(a))}
            stroke="hsl(43 74% 60%)" strokeWidth="1" opacity="0.7" />
        ))}
        {/* Cage ring */}
        <circle r={r * 0.75} fill="none" stroke="hsl(43 74% 50%)" strokeWidth="1" />
        {/* Balance wheel */}
        <g transform={`rotate(${angle * 3})`}>
          <circle r={r * 0.45} fill="none" stroke="hsl(43 74% 70%)" strokeWidth="1.5" />
          {[0, 90, 180, 270].map(a => (
            <line key={a} x1={0} y1={0} x2={r * 0.45 * Math.cos(toRad(a))} y2={r * 0.45 * Math.sin(toRad(a))}
              stroke="hsl(43 74% 65%)" strokeWidth="0.8" />
          ))}
          <circle r={4} fill="hsl(43 74% 80%)" />
        </g>
        {/* Escape wheel */}
        <g transform={`rotate(${-angle * 2})`}>
          {Array.from({ length: 15 }).map((_, i) => {
            const a = (i * 360 / 15);
            const x = r * 0.28 * Math.cos(toRad(a));
            const y = r * 0.28 * Math.sin(toRad(a));
            return <line key={i} x1={x * 0.6} y1={y * 0.6} x2={x} y2={y} stroke="hsl(43 74% 75%)" strokeWidth="0.8" />;
          })}
          <circle r={r * 0.18} fill="none" stroke="hsl(43 74% 55%)" strokeWidth="0.8" />
        </g>
      </g>
      {/* Center jewel */}
      <circle r={3} fill="hsl(0 70% 60%)" />
      <circle r={1.5} fill="hsl(0 90% 80%)" />
    </svg>
  );
}

// ─── WESTMINSTER CHIME VISUALIZER ────────────────────────────────────────────
function WestminsterChime({ minute, second }: { minute: number; second: number }) {
  const pattern = [
    [1,0,0,0], [1,1,0,0], [1,1,1,0], [1,1,1,1],
    [0,1,1,1], [0,0,1,1], [0,0,0,1], [0,1,0,1],
    [1,0,1,0], [0,1,0,0], [1,0,0,1], [1,1,0,1],
    [0,1,1,0], [1,0,1,1], [0,0,1,0], [1,1,1,0],
  ];
  const quarter = Math.floor(minute / 15);
  const activeGongs = pattern[quarter % 16] || [0,0,0,0];
  const bells = ["E♭", "C", "D", "G"];
  const beatPhase = (second % 2) < 1;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3 justify-center">
        {bells.map((note, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="relative w-10 h-16 flex items-end justify-center">
              {/* Bell shape */}
              <svg width="40" height="60" viewBox="0 0 40 60">
                <defs>
                  <linearGradient id={`bellGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={activeGongs[i] && beatPhase ? "hsl(43 74% 80%)" : "hsl(43 74% 35%)"} />
                    <stop offset="100%" stopColor={activeGongs[i] && beatPhase ? "hsl(43 74% 55%)" : "hsl(43 74% 20%)"} />
                  </linearGradient>
                </defs>
                <path d="M 20 5 C 10 5 5 15 5 30 L 5 50 L 35 50 L 35 30 C 35 15 30 5 20 5 Z"
                  fill={`url(#bellGrad${i})`} stroke="hsl(43 74% 50%)" strokeWidth="1" />
                <ellipse cx={20} cy={50} rx={15} ry={3} fill="hsl(43 74% 30%)" />
                <circle cx={20} cy={5} r={3} fill="hsl(43 74% 60%)" />
              </svg>
              {activeGongs[i] === 1 && beatPhase && (
                <div className="absolute -inset-2 rounded-full animate-ping"
                  style={{ background: "hsl(43 74% 50% / 0.3)" }} />
              )}
            </div>
            <span className="text-xs font-bold" style={{ color: activeGongs[i] ? "hsl(43 74% 70%)" : "hsl(43 74% 30%)" }}>{note}</span>
          </div>
        ))}
      </div>
      <div className="text-center text-xs" style={{ color: "hsl(43 74% 40%)" }}>
        Quarter {quarter + 1} of 4 — Minute {minute % 15} past quarter
      </div>
    </div>
  );
}

// ─── PERPETUAL CALENDAR GRID ─────────────────────────────────────────────────
function PerpetualCalendarGrid({ date }: { date: Date }) {
  const year = date.getFullYear(), month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = date.getDate();
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = i - firstDay + 1;
    return d > 0 && d <= daysInMonth ? d : null;
  });
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return (
    <div>
      <div className="text-center text-sm font-bold mb-3 tracking-widest uppercase" style={{ color: "hsl(43 74% 60%)" }}>
        {monthNames[month]} {year}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} className="font-bold py-1" style={{ color: "hsl(43 74% 45%)" }}>{d}</div>
        ))}
        {cells.map((d, i) => (
          <div key={i} className="py-1 rounded"
            style={{
              color: d === today ? "hsl(222 47% 8%)" : d ? "hsl(43 74% 60%)" : "transparent",
              background: d === today ? "hsl(43 74% 55%)" : "transparent",
              fontWeight: d === today ? "bold" : "normal",
            }}>
            {d || ""}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── EQUATION OF TIME CHART ───────────────────────────────────────────────────
function EquationOfTimeChart({ currentEoT, dayOfYear }: { currentEoT: number; dayOfYear: number }) {
  const W = 280, H = 100;
  const points = Array.from({ length: 365 }, (_, i) => {
    const d = new Date(new Date().getFullYear(), 0, i + 1);
    const eot = equationOfTime(d);
    return eot;
  });
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const pts = points.map((v, i) => `${(i / 364) * W},${H - ((v - min) / range) * (H - 10) - 5}`).join(" ");
  const curX = (dayOfYear / 364) * W;
  const curY = H - ((currentEoT - min) / range) * (H - 10) - 5;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="eotFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(43 74% 50% / 0.3)" />
          <stop offset="100%" stopColor="hsl(43 74% 50% / 0)" />
        </linearGradient>
      </defs>
      <line x1={0} y1={H/2} x2={W} y2={H/2} stroke="hsl(43 74% 20%)" strokeWidth="1" strokeDasharray="4 4" />
      <polyline points={pts} fill="none" stroke="hsl(43 74% 50%)" strokeWidth="1.5" />
      {/* Current position */}
      <circle cx={curX} cy={curY} r={4} fill="hsl(43 74% 70%)" />
      <line x1={curX} y1={0} x2={curX} y2={H} stroke="hsl(43 74% 50%)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.5" />
      <text x={4} y={12} fill="hsl(43 74% 35%)" fontSize="8">+{max.toFixed(1)}m</text>
      <text x={4} y={H-2} fill="hsl(43 74% 35%)" fontSize="8">{min.toFixed(1)}m</text>
    </svg>
  );
}

// ─── SEASONAL WHEEL ──────────────────────────────────────────────────────────
function SeasonalWheel({ date }: { date: Date }) {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const totalDays = isLeapYear(date.getFullYear()) ? 366 : 365;
  const angle = (dayOfYear / totalDays) * 360 - 90;
  const size = 180;
  const cx = size/2, cy = size/2, r = 70, rInner = 40;
  const seasons = [
    { name: "Spring", color: "hsl(320 50% 40%)", start: 79, end: 172 },
    { name: "Summer", color: "hsl(43 74% 35%)", start: 172, end: 264 },
    { name: "Autumn", color: "hsl(25 70% 35%)", start: 264, end: 355 },
    { name: "Winter", color: "hsl(210 50% 30%)", start: 355, end: 365 + 79 },
  ];
  const arcPath = (startDay: number, endDay: number) => {
    const a1 = toRad((startDay / totalDays) * 360 - 90);
    const a2 = toRad((endDay / totalDays) * 360 - 90);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const x3 = cx + rInner * Math.cos(a2), y3 = cy + rInner * Math.sin(a2);
    const x4 = cx + rInner * Math.cos(a1), y4 = cy + rInner * Math.sin(a1);
    const large = (endDay - startDay) / totalDays > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
  };
  const handX = cx + (r + 10) * Math.cos(toRad(angle));
  const handY = cy + (r + 10) * Math.sin(toRad(angle));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {seasons.map(s => {
        const end = s.end > totalDays ? s.end - totalDays : s.end;
        return <path key={s.name} d={arcPath(s.start % totalDays, end)} fill={s.color} stroke="hsl(43 74% 20%)" strokeWidth="0.5" />;
      })}
      {/* Equinox/solstice markers */}
      {[79, 172, 264, 355].map((day, i) => {
        const a = toRad((day / totalDays) * 360 - 90);
        const labels = ["☀️","🌸","☀️","❄️"];
        const x = cx + (r + 18) * Math.cos(a);
        const y = cy + (r + 18) * Math.sin(a);
        return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="12">{labels[i]}</text>;
      })}
      {/* Position hand */}
      <line x1={cx} y1={cy} x2={handX} y2={handY} stroke="hsl(43 74% 70%)" strokeWidth="2" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill="hsl(43 74% 55%)" />
      <circle cx={cx} cy={cy} r={3} fill="hsl(222 47% 6%)" />
    </svg>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function WatchShowcase() {
  const [now, setNow] = useState(new Date());
  const [tourbillonAngle, setTourbillonAngle] = useState(0);
  const [location, setLocation] = useState({ lat: 40.7128, lng: -74.006, name: "New York" });
  const [customLat, setCustomLat] = useState("40.7128");
  const [customLng, setCustomLng] = useState("-74.006");

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
      setTourbillonAngle(a => (a + 6) % 360); // 60rpm = 6°/tick at 1s
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Use browser geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, name: "Your Location" });
        setCustomLat(pos.coords.latitude.toFixed(4));
        setCustomLng(pos.coords.longitude.toFixed(4));
      });
    }
  }, []);

  // ─ Computed values ─
  const moon = moonPhase(now);
  const eot = equationOfTime(now);
  const sid = siderealTime(now, location.lng);
  const sun = sunPosition(now);
  const { sunrise, sunset, daylength } = getSunriseSunset(now, location.lat, location.lng);
  const season = getSeason(now);
  const chinese = getChineseLunisolar(now);
  const zodiac = getZodiac(now);
  const leap = getLeapYearInfo(now.getFullYear());
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);

  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const fmtNum = (n: number, d = 2) => n.toFixed(d);
  const pad = (n: number) => n.toString().padStart(2, "0");

  const sidH = Math.floor(sid / 15);
  const sidM = Math.floor((sid % 15) * 4);
  const sidS = Math.floor(((sid % 15) * 4 % 1) * 60);

  const solarTime = new Date(now.getTime() + eot * 60000 + (location.lng / 15) * 3600000 - now.getTimezoneOffset() * 60000);

  // Chinese zodiac animals
  const chineseAnimals = ["🐀","🐂","🐅","🐇","🐉","🐍","🐎","🐐","🐒","🐓","🐕","🐖"];
  const animalEmojis: Record<string,string> = { Rat:"🐀",Ox:"🐂",Tiger:"🐅",Rabbit:"🐇",Dragon:"🐉",Snake:"🐍",Horse:"🐎",Goat:"🐐",Monkey:"🐒",Rooster:"🐓",Dog:"🐕",Pig:"🐖" };

  return (
    <Layout>
      <div className="min-h-screen pb-20" style={{ background: "hsl(222 47% 5%)", color: "hsl(43 30% 80%)" }}>
        {/* Header */}
        <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
          style={{ background: "hsl(222 47% 5% / 0.95)", borderBottom: "1px solid hsl(43 74% 20%)", backdropFilter: "blur(10px)" }}>
          <div>
            <div className="text-xs tracking-widest uppercase" style={{ color: "hsl(43 74% 40%)" }}>Grand Complication</div>
            <div className="text-lg font-bold tracking-wide" style={{ color: "hsl(43 74% 60%)" }}>Astronomical Dashboard</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold tabular-nums" style={{ color: "hsl(43 74% 70%)" }}>
              {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
            </div>
            <div className="text-xs" style={{ color: "hsl(43 74% 40%)" }}>{now.toLocaleDateString(undefined, { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-8 max-w-4xl mx-auto">

          {/* LOCATION */}
          <div className="flex flex-wrap gap-2 items-center text-xs" style={{ color: "hsl(43 74% 40%)" }}>
            <span>📍 {location.name}</span>
            <span>Lat {fmtNum(location.lat, 4)}°</span>
            <span>Lng {fmtNum(location.lng, 4)}°</span>
            <span className="ml-auto">Day {dayOfYear} of {isLeapYear(now.getFullYear()) ? 366 : 365}</span>
          </div>

          {/* ── SECTION 1: MOON PHASE ── */}
          <section>
            <SectionTitle sub="Live lunar calculation">Moon Phase</SectionTitle>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <MoonPhaseSVG phase={moon.phase} illumination={moon.illumination} />
              </div>
              <div className="grid grid-cols-2 gap-3 flex-1 w-full">
                <DataCard title="Phase" value={moon.name} icon="🌙" />
                <DataCard title="Illumination" value={`${(moon.illumination * 100).toFixed(1)}%`} icon="✨" />
                <DataCard title="Lunar Age" value={`${moon.age.toFixed(2)} days`} icon="📅" />
                <DataCard title="Synodic Month" value="29.53 days" icon="🔄" />
              </div>
            </div>
            {/* Moon phase strip */}
            <div className="mt-4 flex justify-between text-center text-xs" style={{ color: "hsl(43 74% 35%)" }}>
              {["🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘"].map((emoji, i) => {
                const isActive = Math.floor(moon.phase * 8) === i;
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-xl" style={{ opacity: isActive ? 1 : 0.35 }}>{emoji}</span>
                    {isActive && <div className="w-1 h-1 rounded-full mx-auto" style={{ background: "hsl(43 74% 55%)" }} />}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── SECTION 2: GREGORIAN PERPETUAL CALENDAR ── */}
          <section>
            <SectionTitle sub="Self-correcting mechanical calendar">Gregorian Perpetual Calendar</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl p-4 border" style={{ background: "hsl(222 47% 6%)", borderColor: "hsl(43 74% 25%)" }}>
                <PerpetualCalendarGrid date={now} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DataCard title="Day of Week" value={now.toLocaleDateString(undefined, { weekday:"long" })} />
                <DataCard title="Day of Year" value={`#${dayOfYear}`} />
                <DataCard title="Week of Year" value={`W${Math.ceil(dayOfYear / 7)}`} />
                <DataCard title="Year" value={now.getFullYear().toString()} accent={isLeapYear(now.getFullYear()) ? "hsl(43 74% 80%)" : undefined} />
                <DataCard title="Leap Year" value={isLeapYear(now.getFullYear()) ? "✓ Yes" : "No"} sub={`Next: ${leap.next}`} />
                <DataCard title="Days Remaining" value={`${(isLeapYear(now.getFullYear()) ? 366 : 365) - dayOfYear} days`} />
              </div>
            </div>
          </section>

          {/* ── SECTION 3: CHINESE LUNISOLAR ── */}
          <section>
            <SectionTitle sub="Traditional Chinese calendar with zodiac animals">Chinese Lunisolar Calendar</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <DataCard title="Chinese Year" value={chinese.year.toString()} icon="🏮" />
              <DataCard title="Zodiac Animal" value={`${animalEmojis[chinese.animal] || "🐲"} ${chinese.animal}`} />
              <DataCard title="Element" value={chinese.element} icon="☯️" />
              <DataCard title="Lunar Month" value={chinese.monthName} sub={`Day ${chinese.dayNum}`} />
            </div>
            {/* 12 Animals grid */}
            <div className="rounded-xl border p-4" style={{ background: "hsl(222 47% 6%)", borderColor: "hsl(43 74% 25%)" }}>
              <div className="text-xs mb-3 tracking-widest uppercase" style={{ color: "hsl(43 74% 40%)" }}>12-Year Zodiac Cycle</div>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                {["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"].map((animal, i) => {
                  const isActive = animal === chinese.animal;
                  return (
                    <div key={animal} className="flex flex-col items-center gap-1 p-1 rounded"
                      style={{ background: isActive ? "hsl(43 74% 20%)" : "transparent", border: isActive ? "1px solid hsl(43 74% 40%)" : "1px solid transparent" }}>
                      <span className="text-lg">{chineseAnimals[i]}</span>
                      <span className="text-xs hidden sm:block" style={{ color: isActive ? "hsl(43 74% 70%)" : "hsl(43 74% 35%)" }}>{animal}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Leap cycles */}
            <div className="mt-3 grid grid-cols-3 gap-3">
              <DataCard title="Leap Cycle" value="19 years" sub="Metonic cycle" icon="🔄" />
              <DataCard title="Lunar Months" value="354/355" sub="Days per lunar year" icon="📆" />
              <DataCard title="Intercalation" value={`~7/19 years`} sub="Leap months added" icon="➕" />
            </div>
          </section>

          {/* ── SECTION 4: ZODIAC ── */}
          <section>
            <SectionTitle sub="Western astronomical zodiac">Zodiac Display</SectionTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="rounded-xl border p-6 flex flex-col items-center justify-center flex-shrink-0"
                style={{ background: "hsl(222 47% 6%)", borderColor: "hsl(43 74% 25%)", minWidth: 150 }}>
                <div className="text-6xl mb-2">{zodiac.symbol}</div>
                <div className="text-lg font-bold" style={{ color: "hsl(43 74% 65%)" }}>{zodiac.sign}</div>
                <div className="text-xs mt-1" style={{ color: "hsl(43 74% 35%)" }}>{zodiac.element}</div>
                <div className="text-xs mt-1" style={{ color: "hsl(43 74% 35%)" }}>From {zodiac.startDate}</div>
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-6 gap-1.5">
                  {["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"].map((sym, i) => {
                    const signs = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
                    const isActive = signs[i] === zodiac.sign;
                    return (
                      <div key={i} className="rounded-lg p-2 text-center transition-all"
                        style={{ background: isActive ? "hsl(43 74% 20%)" : "hsl(222 47% 8%)", border: `1px solid ${isActive ? "hsl(43 74% 45%)" : "hsl(43 74% 15%)"}` }}>
                        <div className="text-xl" style={{ color: isActive ? "hsl(43 74% 70%)" : "hsl(43 74% 35%)" }}>{sym}</div>
                        <div className="text-xs mt-0.5 hidden sm:block" style={{ color: isActive ? "hsl(43 74% 55%)" : "hsl(43 74% 25%)" }}>{signs[i]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* Sun in zodiac */}
            <div className="mt-3">
              <DataCard title="Sun's Current Position" value={`${fmtNum(sun.declination, 2)}° Declination`}
                sub={`Right Ascension: ${fmtNum(sun.rightAscension, 2)}°`} icon="☀️" />
            </div>
          </section>

          {/* ── SECTION 5: SUNRISE/SUNSET ── */}
          <section>
            <SectionTitle sub="Calculated for your location">Sunrise & Sunset</SectionTitle>
            <div className="rounded-xl border p-4 mb-3" style={{ background: "hsl(222 47% 6%)", borderColor: "hsl(43 74% 25%)" }}>
              {/* Sun arc visualization */}
              <svg width="100%" height="100" viewBox="0 0 300 100" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="skyDay" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(200 60% 20%)" />
                    <stop offset="100%" stopColor="hsl(222 47% 8%)" />
                  </linearGradient>
                </defs>
                <rect width="300" height="100" fill="url(#skyDay)" />
                {/* Horizon */}
                <line x1={0} y1={80} x2={300} y2={80} stroke="hsl(43 74% 30%)" strokeWidth="1" />
                {/* Sun arc path */}
                <path d="M 20 80 Q 150 10 280 80" fill="none" stroke="hsl(43 74% 40%)" strokeWidth="1" strokeDasharray="4 3" />
                {/* Current sun position */}
                {(() => {
                  const totalMins = (sunset.getTime() - sunrise.getTime()) / 60000;
                  const elapsedMins = (now.getTime() - sunrise.getTime()) / 60000;
                  const t = Math.max(0, Math.min(1, elapsedMins / totalMins));
                  const x = 20 + t * 260;
                  const arc = -80 * Math.sin(t * Math.PI);
                  const y = 80 + arc;
                  const isDay = t >= 0 && t <= 1;
                  return isDay ? (
                    <g>
                      <circle cx={x} cy={y} r={10} fill="hsl(43 74% 55%)" opacity="0.3" />
                      <circle cx={x} cy={y} r={7} fill="hsl(43 74% 70%)" />
                      <circle cx={x} cy={y} r={3} fill="hsl(43 74% 95%)" />
                    </g>
                  ) : null;
                })()}
                {/* Labels */}
                <text x={20} y={95} fill="hsl(43 74% 50%)" fontSize="9" textAnchor="middle">🌅 {fmt(sunrise)}</text>
                <text x={280} y={95} fill="hsl(200 50% 60%)" fontSize="9" textAnchor="middle">🌇 {fmt(sunset)}</text>
                <text x={150} y={18} fill="hsl(43 74% 55%)" fontSize="9" textAnchor="middle">Altitude: {fmtNum(sun.altitude, 1)}°</text>
              </svg>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <DataCard title="Sunrise" value={fmt(sunrise)} icon="🌅" />
              <DataCard title="Sunset" value={fmt(sunset)} icon="🌇" />
              <DataCard title="Day Length" value={`${fmtNum(daylength, 2)}h`} icon="⏱️" />
              <DataCard title="Solar Altitude" value={`${fmtNum(sun.altitude, 2)}°`}
                accent={sun.altitude > 0 ? "hsl(43 74% 70%)" : "hsl(200 60% 60%)"} />
            </div>
          </section>

          {/* ── SECTION 6: EQUATION OF TIME ── */}
          <section>
            <SectionTitle sub="Difference between civil & apparent solar time">Equation of Time</SectionTitle>
            <div className="rounded-xl border p-4 mb-3" style={{ background: "hsl(222 47% 6%)", borderColor: "hsl(43 74% 25%)" }}>
              <EquationOfTimeChart currentEoT={eot} dayOfYear={dayOfYear} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <DataCard title="EoT Value" value={`${eot >= 0 ? "+" : ""}${fmtNum(eot, 2)} min`}
                sub="Clock ahead of Sun" icon="⏰" accent={eot > 0 ? "hsl(43 74% 70%)" : "hsl(200 60% 70%)"} />
              <DataCard title="Apparent Solar Time" value={solarTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} icon="☀️" />
              <DataCard title="Civil Time" value={now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} icon="🕐" />
            </div>
          </section>

          {/* ── SECTION 7: SIDEREAL TIME ── */}
          <section>
            <SectionTitle sub="Star time — Earth's rotation relative to distant stars">Sidereal Time</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border p-4" style={{ background: "hsl(222 47% 6%)", borderColor: "hsl(43 74% 25%)" }}>
                <div className="text-xs mb-2 uppercase tracking-widest" style={{ color: "hsl(43 74% 40%)" }}>Local Sidereal Time</div>
                <div className="text-4xl font-mono font-bold tabular-nums" style={{ color: "hsl(43 74% 70%)" }}>
                  {pad(sidH)}h {pad(sidM)}m {pad(sidS)}s
                </div>
                <div className="text-xs mt-2" style={{ color: "hsl(43 74% 35%)" }}>= {fmtNum(sid, 4)}°</div>
                <div className="text-xs mt-1" style={{ color: "hsl(43 74% 35%)" }}>
                  Sidereal day = 23h 56m 4.09s<br />
                  {fmtNum((23 * 3600 + 56 * 60 + 4.09 - (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds())) / 60, 0)} minutes until next sidereal noon
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DataCard title="GMST" value={`${fmtNum(siderealTime(now, 0), 2)}°`} sub="Greenwich MST" />
                <DataCard title="LMST" value={`${fmtNum(sid, 2)}°`} sub="Local MST" />
                <DataCard title="Solar vs Sidereal" value="+3m 56s/day" sub="Sidereal day shorter" />
                <DataCard title="RA on Meridian" value={`${pad(sidH)}h ${pad(sidM)}m`} sub="Right Ascension" />
              </div>
            </div>
          </section>

          {/* ── SECTION 8: STAR CHART / SKY CHART ── */}
          <section>
            <SectionTitle sub="Live star positions based on sidereal time">Star Chart & Sky Map</SectionTitle>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="rounded-xl border p-3 flex-shrink-0" style={{ background: "hsl(222 47% 6%)", borderColor: "hsl(43 74% 25%)" }}>
                <StarChartSVG siderealDeg={sid} />
                <div className="text-center text-xs mt-2" style={{ color: "hsl(43 74% 35%)" }}>Rotating with sidereal time</div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "hsl(43 74% 40%)" }}>Brightest Stars Now</div>
                {STARS.slice(0, 8).map(star => {
                  const raAdj = ((star.ra - sid) % 360 + 360) % 360;
                  const isVisible = star.dec + 90 > (90 - location.lat);
                  return (
                    <div key={star.name} className="flex items-center justify-between text-xs py-1 border-b"
                      style={{ borderColor: "hsl(43 74% 12%)" }}>
                      <span style={{ color: "hsl(43 74% 60%)" }}>★ {star.name}</span>
                      <span style={{ color: "hsl(43 74% 35%)" }}>Mag {star.mag.toFixed(2)}</span>
                      <span style={{ color: "hsl(43 74% 35%)" }}>RA {star.ra.toFixed(1)}°</span>
                      <span style={{ color: isVisible ? "hsl(120 50% 50%)" : "hsl(0 50% 50%)" }}>
                        {isVisible ? "Visible" : "Below horizon"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── SECTION 9: SEASONS & SOLSTICES ── */}
          <section>
            <SectionTitle sub="Earth's orbital position and astronomical seasons">Seasons & Equinoxes</SectionTitle>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <SeasonalWheel date={now} />
              <div className="flex-1 grid grid-cols-2 gap-3">
                <DataCard title="Current Season" value={season.name} icon={season.icon} accent={season.color} />
                <DataCard title="Season Progress" value={`${(season.progress * 100).toFixed(1)}%`} />
                <DataCard title="Spring Equinox" value="~Mar 20" sub={`${now.getFullYear()}`} icon="🌸" />
                <DataCard title="Summer Solstice" value="~Jun 21" sub="Longest day" icon="☀️" />
                <DataCard title="Autumn Equinox" value="~Sep 23" sub={`${now.getFullYear()}`} icon="🍂" />
                <DataCard title="Winter Solstice" value="~Dec 21" sub="Shortest day" icon="❄️" />
              </div>
            </div>
            {/* Declination bar */}
            <div className="mt-4 rounded-xl border p-4" style={{ background: "hsl(222 47% 6%)", borderColor: "hsl(43 74% 25%)" }}>
              <div className="text-xs mb-2 uppercase tracking-widest" style={{ color: "hsl(43 74% 40%)" }}>Solar Declination (−23.5° to +23.5°)</div>
              <div className="relative h-6 rounded-full overflow-hidden" style={{ background: "hsl(222 47% 10%)" }}>
                <div className="absolute inset-y-0 left-1/2 w-px" style={{ background: "hsl(43 74% 30%)" }} />
                <div className="absolute inset-y-0 w-2 h-2 my-auto rounded-full -translate-x-1"
                  style={{ background: "hsl(43 74% 70%)", left: `${((sun.declination + 23.5) / 47) * 100}%`, top: "50%", transform: "translateX(-50%) translateY(-50%)" }} />
              </div>
              <div className="flex justify-between text-xs mt-1" style={{ color: "hsl(43 74% 35%)" }}>
                <span>−23.5° (Winter Solstice)</span>
                <span className="font-bold" style={{ color: "hsl(43 74% 55%)" }}>{fmtNum(sun.declination, 2)}°</span>
                <span>+23.5° (Summer Solstice)</span>
              </div>
            </div>
          </section>

          {/* ── SECTION 10: TOURBILLON ── */}
          <section>
            <SectionTitle sub="60 rpm precision regulating mechanism">Tourbillon Regulator</SectionTitle>
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="flex flex-col items-center gap-3">
                <TourbillonSVG angle={tourbillonAngle} />
                <div className="text-xs text-center" style={{ color: "hsl(43 74% 40%)" }}>
                  Live animation • 60 rpm<br />
                  Compensating for gravity
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <DataCard title="Rotation Speed" value="60 rpm" sub="1 revolution/second" icon="⚙️" />
                <DataCard title="Beat Rate" value="21,600 vph" sub="3 Hz" icon="💓" />
                <DataCard title="Cage Weight" value="~0.3g" sub="Featherlight" icon="⚖️" />
                <DataCard title="Escapement" value="Swiss Lever" sub="Traditional" icon="🔧" />
                <DataCard title="Power Reserve" value="~65 hours" sub="Hand-wound" icon="🔋" />
                <DataCard title="Pivot Count" value="72" sub="Pivot points in cage" icon="🔩" />
              </div>
            </div>
          </section>

          {/* ── SECTION 11: WESTMINSTER REPEATER ── */}
          <section>
            <SectionTitle sub="4-gong chiming mechanism — strikes hours, quarters, minutes">Westminster Minute Repeater</SectionTitle>
            <div className="rounded-xl border p-6" style={{ background: "hsl(222 47% 6%)", borderColor: "hsl(43 74% 25%)" }}>
              <WestminsterChime minute={now.getMinutes()} second={now.getSeconds()} />
              <GoldDivider />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <DataCard title="Current Hour" value={`${pad(now.getHours() % 12 || 12)}h`} icon="🔔" />
                <DataCard title="Quarter" value={`Q${Math.floor(now.getMinutes() / 15) + 1}`} sub="of 4 per hour" />
                <DataCard title="Minutes Past" value={`${now.getMinutes() % 15}m`} sub="After quarter" />
                <DataCard title="Chime Sequence" value="E♭-C-D-G" sub="Westminster pattern" />
              </div>
              <div className="mt-4 text-xs" style={{ color: "hsl(43 74% 35%)" }}>
                <p>The Westminster chime sequence uses 4 notes: E♭, C, D, G. Each quarter hour plays a different combination of these notes, building up to the full 16-note sequence at the top of the hour, followed by the hour strike on the low-G gong.</p>
              </div>
            </div>
          </section>

          {/* ── SECTION 12: SOLAR TIME ── */}
          <section>
            <SectionTitle sub="Apparent vs mean solar time">Solar Time vs Civil Time</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border p-4" style={{ background: "hsl(222 47% 6%)", borderColor: "hsl(43 74% 25%)" }}>
                <div className="text-xs mb-1 uppercase tracking-widest" style={{ color: "hsl(43 74% 40%)" }}>Apparent Solar Time</div>
                <div className="text-3xl font-mono font-bold" style={{ color: "hsl(43 74% 70%)" }}>
                  {solarTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </div>
                <div className="text-xs mt-2" style={{ color: "hsl(43 74% 35%)" }}>Based on actual Sun position + longitude correction</div>
              </div>
              <div className="rounded-xl border p-4" style={{ background: "hsl(222 47% 6%)", borderColor: "hsl(43 74% 25%)" }}>
                <div className="text-xs mb-1 uppercase tracking-widest" style={{ color: "hsl(43 74% 40%)" }}>Mean Civil Time (Local)</div>
                <div className="text-3xl font-mono font-bold" style={{ color: "hsl(200 60% 65%)" }}>
                  {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </div>
                <div className="text-xs mt-2" style={{ color: "hsl(43 74% 35%)" }}>Standard timezone time</div>
              </div>
            </div>
            <div className="mt-3">
              <DataCard title="Time Difference" value={`${eot >= 0 ? "+" : ""}${fmtNum(eot, 2)} minutes`}
                sub="Solar time ahead of clock time" icon="⚖️" />
            </div>
          </section>

          {/* ── FOOTER ── */}
          <div className="text-center py-8">
            <GoldDivider />
            <p className="text-xs mt-4 tracking-widest italic" style={{ color: "hsl(43 74% 30%)" }}>
              "A masterpiece of time, astronomy, and human craftsmanship."
            </p>
            <p className="text-xs mt-2" style={{ color: "hsl(43 74% 20%)" }}>
              All calculations performed in real-time • Updates every second
            </p>
          </div>

        </div>
      </div>
    </Layout>
  );
}
