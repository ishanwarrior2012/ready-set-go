import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { MapPin, LocateFixed, X, RefreshCw } from "lucide-react";

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
  return ((q - RA + 180) % 360 - 180) * 4;
}

function siderealTime(date: Date, longitude = 0): number {
  const jd = julianDay(date);
  const T = (jd - 2451545.0) / 36525;
  const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T - T * T * T / 38710000;
  return ((gmst + longitude) % 360 + 360) % 360;
}

function sunPosition(date: Date, lat = 40.7128): { altitude: number; azimuth: number; declination: number; rightAscension: number } {
  const D = julianDay(date) - 2451545.0;
  const g = toRad((357.529 + 0.98560028 * D) % 360);
  const q = toRad((280.459 + 0.98564736 * D) % 360);
  const L = toRad((toDeg(q) + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) % 360);
  const e = toRad(23.439 - 0.0000004 * D);
  const declination = Math.asin(Math.sin(e) * Math.sin(L));
  const rightAscension = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  const latRad = toRad(lat);
  const ha = toRad(siderealTime(date)) - rightAscension;
  const altitude = Math.asin(Math.sin(latRad) * Math.sin(declination) + Math.cos(latRad) * Math.cos(declination) * Math.cos(ha));
  const azimuth = Math.atan2(-Math.sin(ha), Math.tan(declination) * Math.cos(latRad) - Math.sin(latRad) * Math.cos(ha));
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

function getSeason(date: Date): { name: string; progress: number; icon: string } {
  const month = date.getMonth();
  const day = date.getDate();
  if ((month === 2 && day >= 20) || month === 3 || month === 4 || (month === 5 && day < 21))
    return { name: "Spring", progress: ((month - 2) * 30 + day) / 92, icon: "🌸" };
  if ((month === 5 && day >= 21) || month === 6 || month === 7 || (month === 8 && day < 23))
    return { name: "Summer", progress: ((month - 5) * 30 + day - 21) / 92, icon: "☀️" };
  if ((month === 8 && day >= 23) || month === 9 || month === 10 || (month === 11 && day < 21))
    return { name: "Autumn", progress: ((month - 8) * 30 + day - 23) / 91, icon: "🍂" };
  return { name: "Winter", progress: ((month < 2 ? month + 1 : 0) * 30 + day) / 89, icon: "❄️" };
}

function getChineseLunisolar(date: Date) {
  const animals = ["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"];
  const elements = ["Wood","Wood","Fire","Fire","Earth","Earth","Metal","Metal","Water","Water"];
  const months = ["正月","二月","三月","四月","五月","六月","七月","八月","九月","十月","冬月","腊月"];
  const year = date.getFullYear();
  const animal = animals[((year - 2020) % 12 + 12) % 12];
  const element = elements[((year - 2020) % 10 + 10) % 10];
  const jd = julianDay(date);
  const lunarDay = Math.floor(((jd - 2451549.5) % 29.53058867 + 29.53058867) % 29.53058867) + 1;
  const lunarMonth = Math.floor(((jd - 2451549.5) / 29.53058867 + 0.5) % 12);
  return { year: year - 1900, animal, element, monthName: months[Math.abs(lunarMonth) % 12], dayNum: lunarDay };
}

function getZodiac(date: Date) {
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

function getLeapYearInfo(year: number) {
  let last = year - 1;
  while (!isLeapYear(last)) last--;
  let next = year + 1;
  while (!isLeapYear(next)) next++;
  return { current: isLeapYear(year), last, next };
}

// ─── STAR DATA ────────────────────────────────────────────────────────────────
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
  { name: "Alnilam", ra: 84.1, dec: -1.2, mag: 1.70 },
  { name: "Alnitak", ra: 85.2, dec: -1.94, mag: 1.77 },
  { name: "Dubhe", ra: 165.9, dec: 61.75, mag: 1.79 },
  { name: "Mirfak", ra: 51.1, dec: 49.86, mag: 1.79 },
  { name: "Alioth", ra: 193.5, dec: 55.96, mag: 1.76 },
  { name: "Alkaid", ra: 206.9, dec: 49.31, mag: 1.85 },
];

// ─── GEOLOCATION DIALOG ───────────────────────────────────────────────────────
interface GeoLocation { lat: number; lng: number; name: string }

function LocationDialog({
  onAllow, onDeny
}: { onAllow: (loc: GeoLocation) => void; onDeny: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAllow = () => {
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        onAllow({ lat: pos.coords.latitude, lng: pos.coords.longitude, name: "Your Location" });
      },
      (err) => {
        setLoading(false);
        setError(err.code === 1 ? "Location permission denied by browser." : "Unable to retrieve your location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "hsl(var(--background) / 0.85)", backdropFilter: "blur(8px)" }}>
      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <LocateFixed className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-foreground font-semibold text-base">Use Your Location</h2>
            <p className="text-muted-foreground text-xs">For accurate astronomical data</p>
          </div>
        </div>

        <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
          Allow the Grand Complication dashboard to access your GPS coordinates for precise:
        </p>
        <ul className="space-y-1 mb-5">
          {["Sunrise & Sunset times","Solar altitude & azimuth","Star visibility from your horizon","Sidereal time correction"].map(item => (
            <li key={item} className="flex items-center gap-2 text-sm text-foreground">
              <span className="text-primary">✓</span> {item}
            </li>
          ))}
        </ul>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onDeny} disabled={loading}>
            <X className="w-4 h-4 mr-1" /> Use Default
          </Button>
          <Button className="flex-1" onClick={handleAllow} disabled={loading}>
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4 mr-1" />
            )}
            {loading ? "Locating…" : "Allow"}
          </Button>
        </div>
        <p className="text-muted-foreground text-xs text-center mt-3">
          Default: New York (40.71°N, 74.01°W)
        </p>
      </div>
    </div>
  );
}

// ─── SHARED UI COMPONENTS ────────────────────────────────────────────────────

function Divider() {
  return <div className="w-full h-px my-2 bg-border" />;
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold tracking-widest uppercase text-primary">{children}</h2>
      {sub && <p className="text-sm mt-0.5 text-muted-foreground">{sub}</p>}
      <Divider />
    </div>
  );
}

function DataCard({ title, value, sub, icon, highlight }: {
  title: string; value: string; sub?: string; icon?: string; highlight?: boolean
}) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? "bg-primary/10 border-primary/30" : "bg-card border-border"}`}>
      {icon && <div className="text-xl mb-1">{icon}</div>}
      <div className="text-xs uppercase tracking-widest mb-0.5 text-muted-foreground">{title}</div>
      <div className={`text-base font-bold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</div>
      {sub && <div className="text-xs mt-0.5 text-muted-foreground">{sub}</div>}
    </div>
  );
}

// ─── MOON PHASE SVG ──────────────────────────────────────────────────────────
function MoonPhaseSVG({ phase, illumination }: { phase: number; illumination: number }) {
  const size = 120, r = 50, cx = 60, cy = 60;
  const isWaxing = phase < 0.5;
  const isNewMoon = phase < 0.02 || phase > 0.98;
  const isFullMoon = Math.abs(phase - 0.5) < 0.02;
  const xScale = Math.cos(phase * 2 * Math.PI);
  const rx = Math.abs(r * xScale);
  const sweep1 = isWaxing ? 0 : 1;
  const sweep2 = isWaxing ? 1 : 0;
  const litPath = isNewMoon || isFullMoon ? "" :
    `M ${cx} ${cy - r} A ${rx} ${r} 0 0 ${sweep1} ${cx} ${cy + r} A ${r} ${r} 0 0 ${sweep2} ${cx} ${cy - r}`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="moonGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.95" />
          <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.6" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
      {isFullMoon && <circle cx={cx} cy={cy} r={r} fill="url(#moonGlow)" />}
      {!isNewMoon && !isFullMoon && <path d={litPath} fill="url(#moonGlow)" />}
      <circle cx={cx + 15} cy={cy - 10} r={4} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.5" />
      <circle cx={cx - 20} cy={cy + 15} r={6} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
}

// ─── STAR CHART SVG ──────────────────────────────────────────────────────────
function StarChartSVG({ siderealDeg, lat }: { siderealDeg: number; lat: number }) {
  const size = 260, cx = size / 2, cy = size / 2, radius = size / 2 - 12;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      <defs>
        <radialGradient id="skyGrad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="hsl(var(--card))" />
          <stop offset="100%" stopColor="hsl(var(--background))" />
        </radialGradient>
        <clipPath id="skyClip"><circle cx={cx} cy={cy} r={radius} /></clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={radius} fill="url(#skyGrad)" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      {[0.33, 0.66, 1.0].map(f => (
        <circle key={f} cx={cx} cy={cy} r={radius * f} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.5" />
      ))}
      <line x1={cx} y1={10} x2={cx} y2={size - 10} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.4" />
      <line x1={10} y1={cy} x2={size - 10} y2={cy} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.4" />
      {[["N",cx,16],["E",size-10,cy+4],["S",cx,size-4],["W",10,cy+4]].map(([l,x,y]) => (
        <text key={l as string} x={x as number} y={y as number} textAnchor="middle" fill="hsl(var(--primary))" fontSize="9" fontWeight="bold">{l as string}</text>
      ))}
      <g clipPath="url(#skyClip)">
        {STARS.map((star) => {
          const raAdj = ((star.ra - siderealDeg) % 360 + 360) % 360;
          const raRad = toRad(raAdj - 180);
          const projR = radius * (90 - star.dec) / 90;
          const x = cx + projR * Math.sin(raRad + Math.PI);
          const y = cy - projR * Math.cos(raRad + Math.PI) * 0.7;
          const starR = Math.max(0.8, 3 - star.mag * 1.2);
          const brightness = Math.max(0.3, 1 - star.mag * 0.3);
          if (x < 0 || x > size || y < 0 || y > size) return null;
          return (
            <g key={star.name}>
              <circle cx={x} cy={y} r={starR + 2} fill={`hsl(var(--primary) / ${brightness * 0.2})`} />
              <circle cx={x} cy={y} r={starR} fill={`hsl(var(--foreground) / ${brightness})`} />
              {star.mag < 0.5 && (
                <text x={x + 5} y={y + 3} fill="hsl(var(--muted-foreground))" fontSize="7" opacity="0.8">{star.name}</text>
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
          <stop offset="0%" stopColor="hsl(var(--primary) / 0.4)" />
          <stop offset="100%" stopColor="hsl(var(--card))" />
        </radialGradient>
      </defs>
      <circle r={r} fill="url(#tGrad)" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <g transform={`rotate(${angle})`}>
        {[0, 60, 120, 180, 240, 300].map(a => (
          <line key={a} x1={0} y1={0}
            x2={r * 0.8 * Math.cos(toRad(a))} y2={r * 0.8 * Math.sin(toRad(a))}
            stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.7" />
        ))}
        <circle r={r * 0.75} fill="none" stroke="hsl(var(--primary))" strokeWidth="1" />
        <g transform={`rotate(${angle * 3})`}>
          <circle r={r * 0.45} fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.7" />
          {[0, 90, 180, 270].map(a => (
            <line key={a} x1={0} y1={0}
              x2={r * 0.45 * Math.cos(toRad(a))} y2={r * 0.45 * Math.sin(toRad(a))}
              stroke="hsl(var(--foreground))" strokeWidth="0.8" opacity="0.6" />
          ))}
          <circle r={4} fill="hsl(var(--primary))" />
        </g>
        <g transform={`rotate(${-angle * 2})`}>
          {Array.from({ length: 15 }).map((_, i) => {
            const a = (i * 360 / 15);
            const x = r * 0.28 * Math.cos(toRad(a));
            const y = r * 0.28 * Math.sin(toRad(a));
            return <line key={i} x1={x * 0.6} y1={y * 0.6} x2={x} y2={y}
              stroke="hsl(var(--foreground))" strokeWidth="0.8" opacity="0.5" />;
          })}
          <circle r={r * 0.18} fill="none" stroke="hsl(var(--border))" strokeWidth="0.8" />
        </g>
      </g>
      <circle r={3} fill="hsl(var(--destructive))" />
      <circle r={1.5} fill="hsl(var(--foreground))" />
    </svg>
  );
}

// ─── WESTMINSTER CHIME ────────────────────────────────────────────────────────
function WestminsterChime({ minute, second }: { minute: number; second: number }) {
  const pattern = [
    [1,0,0,0],[1,1,0,0],[1,1,1,0],[1,1,1,1],
    [0,1,1,1],[0,0,1,1],[0,0,0,1],[0,1,0,1],
    [1,0,1,0],[0,1,0,0],[1,0,0,1],[1,1,0,1],
    [0,1,1,0],[1,0,1,1],[0,0,1,0],[1,1,1,0],
  ];
  const quarter = Math.floor(minute / 15);
  const activeGongs = pattern[quarter % 16] || [0,0,0,0];
  const bells = ["E♭", "C", "D", "G"];
  const beat = (second % 2) < 1;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4 justify-center">
        {bells.map((note, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="relative w-10 h-14">
              <svg width="40" height="56" viewBox="0 0 40 56">
                <defs>
                  <linearGradient id={`bg${i}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={activeGongs[i] && beat ? "hsl(var(--primary))" : "hsl(var(--muted))"} />
                    <stop offset="100%" stopColor={activeGongs[i] && beat ? "hsl(var(--primary) / 0.6)" : "hsl(var(--border))"} />
                  </linearGradient>
                </defs>
                <path d="M 20 4 C 10 4 5 14 5 28 L 5 48 L 35 48 L 35 28 C 35 14 30 4 20 4 Z"
                  fill={`url(#bg${i})`} stroke="hsl(var(--primary))" strokeWidth="1" />
                <ellipse cx={20} cy={48} rx={15} ry={3} fill="hsl(var(--muted))" />
                <circle cx={20} cy={4} r={3} fill="hsl(var(--primary))" />
              </svg>
              {activeGongs[i] === 1 && beat && (
                <div className="absolute -inset-2 rounded-full animate-ping bg-primary/20" />
              )}
            </div>
            <span className={`text-xs font-bold ${activeGongs[i] ? "text-primary" : "text-muted-foreground"}`}>{note}</span>
          </div>
        ))}
      </div>
      <div className="text-center text-xs text-muted-foreground">
        Quarter {quarter + 1} of 4 — {minute % 15}m past quarter
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
      <div className="text-center text-sm font-bold mb-3 tracking-widest uppercase text-primary">
        {monthNames[month]} {year}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} className="font-bold py-1 text-muted-foreground">{d}</div>
        ))}
        {cells.map((d, i) => (
          <div key={i} className={`py-1 rounded transition-colors ${d === today ? "bg-primary text-primary-foreground font-bold" : d ? "text-foreground" : ""}`}>
            {d || ""}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── EQUATION OF TIME CHART ───────────────────────────────────────────────────
function EquationOfTimeChart({ currentEoT, dayOfYear }: { currentEoT: number; dayOfYear: number }) {
  const W = 280, H = 90;
  const year = new Date().getFullYear();
  const points = Array.from({ length: 365 }, (_, i) => equationOfTime(new Date(year, 0, i + 1)));
  const min = Math.min(...points), max = Math.max(...points), range = max - min || 1;
  const pts = points.map((v, i) => `${(i / 364) * W},${H - ((v - min) / range) * (H - 10) - 5}`).join(" ");
  const curX = (dayOfYear / 364) * W;
  const curY = H - ((currentEoT - min) / range) * (H - 10) - 5;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="4 4" />
      <polyline points={pts} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <line x1={curX} y1={0} x2={curX} y2={H} stroke="hsl(var(--primary))" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.5" />
      <circle cx={curX} cy={curY} r={4} fill="hsl(var(--primary))" />
      <text x={4} y={12} fill="hsl(var(--muted-foreground))" fontSize="8">+{max.toFixed(1)}m</text>
      <text x={4} y={H - 2} fill="hsl(var(--muted-foreground))" fontSize="8">{min.toFixed(1)}m</text>
    </svg>
  );
}

// ─── SEASONAL WHEEL ──────────────────────────────────────────────────────────
function SeasonalWheel({ date }: { date: Date }) {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const totalDays = isLeapYear(date.getFullYear()) ? 366 : 365;
  const angle = (dayOfYear / totalDays) * 360 - 90;
  const size = 170, cx = size / 2, cy = size / 2, r = 65, rInner = 38;
  const seasons = [
    { name: "Spring", color: "hsl(var(--success) / 0.5)", start: 79, end: 172 },
    { name: "Summer", color: "hsl(var(--warning) / 0.5)", start: 172, end: 264 },
    { name: "Autumn", color: "hsl(var(--accent) / 0.4)", start: 264, end: 355 },
    { name: "Winter", color: "hsl(var(--info) / 0.4)", start: 355, end: 365 + 79 },
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
  const handX = cx + (r + 8) * Math.cos(toRad(angle));
  const handY = cy + (r + 8) * Math.sin(toRad(angle));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {seasons.map(s => {
        const end = s.end > totalDays ? s.end - totalDays : s.end;
        return <path key={s.name} d={arcPath(s.start % totalDays, end)} fill={s.color} stroke="hsl(var(--border))" strokeWidth="0.5" />;
      })}
      {[79, 172, 264, 355].map((day, i) => {
        const a = toRad((day / totalDays) * 360 - 90);
        const labels = ["🌸", "☀️", "🍂", "❄️"];
        const x = cx + (r + 18) * Math.cos(a);
        const y = cy + (r + 18) * Math.sin(a);
        return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="12">{labels[i]}</text>;
      })}
      <line x1={cx} y1={cy} x2={handX} y2={handY} stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={5} fill="hsl(var(--primary))" />
      <circle cx={cx} cy={cy} r={2.5} fill="hsl(var(--background))" />
    </svg>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function WatchShowcase() {
  const [now, setNow] = useState(new Date());
  const [tourbillonAngle, setTourbillonAngle] = useState(0);
  const [location, setLocation] = useState<GeoLocation>({ lat: 40.7128, lng: -74.006, name: "New York (default)" });
  const [showGeoDialog, setShowGeoDialog] = useState(false);
  const [geoGranted, setGeoGranted] = useState(false);

  // Tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
      setTourbillonAngle(a => (a + 6) % 360);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Show location dialog on first load if geolocation is supported
  useEffect(() => {
    if (navigator.geolocation && !geoGranted) {
      setShowGeoDialog(true);
    }
  }, []);

  const handleGeoAllow = useCallback((loc: GeoLocation) => {
    setLocation(loc);
    setGeoGranted(true);
    setShowGeoDialog(false);
  }, []);

  const handleGeoDeny = useCallback(() => {
    setShowGeoDialog(false);
  }, []);

  const requestLocation = () => setShowGeoDialog(true);

  // ─ Computed values ─
  const moon = moonPhase(now);
  const eot = equationOfTime(now);
  const sid = siderealTime(now, location.lng);
  const sun = sunPosition(now, location.lat);
  const { sunrise, sunset, daylength } = getSunriseSunset(now, location.lat, location.lng);
  const season = getSeason(now);
  const chinese = getChineseLunisolar(now);
  const zodiac = getZodiac(now);
  const leap = getLeapYearInfo(now.getFullYear());
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const totalDays = isLeapYear(now.getFullYear()) ? 366 : 365;

  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const fmtNum = (n: number, d = 2) => n.toFixed(d);
  const pad = (n: number) => n.toString().padStart(2, "0");

  const sidH = Math.floor(sid / 15);
  const sidM = Math.floor((sid % 15) * 4);
  const sidS = Math.floor(((sid % 15) * 4 % 1) * 60);

  const solarTime = new Date(now.getTime() + eot * 60000 + (location.lng / 15) * 3600000 - now.getTimezoneOffset() * 60000);

  const chineseAnimals: Record<string, string> = { Rat:"🐀",Ox:"🐂",Tiger:"🐅",Rabbit:"🐇",Dragon:"🐉",Snake:"🐍",Horse:"🐎",Goat:"🐐",Monkey:"🐒",Rooster:"🐓",Dog:"🐕",Pig:"🐖" };
  const animalList = ["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"];

  return (
    <Layout>
      {showGeoDialog && <LocationDialog onAllow={handleGeoAllow} onDeny={handleGeoDeny} />}

      <div className="min-h-screen pb-24 bg-background text-foreground">
        {/* ── STICKY HEADER ── */}
        <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between bg-background/95 border-b border-border backdrop-blur-sm">
          <div>
            <div className="text-xs tracking-widest uppercase text-muted-foreground">Grand Complication</div>
            <div className="text-base font-bold text-primary">Astronomical Dashboard</div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={requestLocation} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg border border-border hover:border-primary">
              <LocateFixed className="w-3.5 h-3.5" />
              {geoGranted ? "GPS ✓" : "Set Location"}
            </button>
            <div className="text-right">
              <div className="text-xl font-mono font-bold tabular-nums text-primary">
                {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
              </div>
              <div className="text-xs text-muted-foreground hidden sm:block">
                {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-8 max-w-4xl mx-auto">

          {/* Location Bar */}
          <div className="flex flex-wrap gap-3 items-center text-xs text-muted-foreground bg-card border border-border rounded-lg px-3 py-2">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="text-foreground font-medium">{location.name}</span>
            <span>Lat {fmtNum(location.lat, 4)}°</span>
            <span>Lng {fmtNum(location.lng, 4)}°</span>
            <span className="ml-auto">Day {dayOfYear} / {totalDays}</span>
          </div>

          {/* ── MOON PHASE ── */}
          <section>
            <SectionTitle sub="Live lunar calculation updated every second">Moon Phase</SectionTitle>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <MoonPhaseSVG phase={moon.phase} illumination={moon.illumination} />
              </div>
              <div className="grid grid-cols-2 gap-3 flex-1 w-full">
                <DataCard title="Phase" value={moon.name} icon="🌙" highlight />
                <DataCard title="Illumination" value={`${(moon.illumination * 100).toFixed(1)}%`} icon="✨" />
                <DataCard title="Lunar Age" value={`${moon.age.toFixed(2)} days`} icon="📅" />
                <DataCard title="Synodic Month" value="29.53 days" icon="🔄" />
              </div>
            </div>
            <div className="mt-4 flex justify-between text-center">
              {["🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘"].map((e, i) => {
                const active = Math.floor(moon.phase * 8) === i;
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-xl" style={{ opacity: active ? 1 : 0.3 }}>{e}</span>
                    {active && <div className="w-1 h-1 rounded-full bg-primary mx-auto" />}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── GREGORIAN PERPETUAL CALENDAR ── */}
          <section>
            <SectionTitle sub="Self-correcting mechanical calendar">Gregorian Perpetual Calendar</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl p-4 bg-card border border-border">
                <PerpetualCalendarGrid date={now} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DataCard title="Day of Week" value={now.toLocaleDateString(undefined, { weekday: "long" })} />
                <DataCard title="Day of Year" value={`#${dayOfYear}`} />
                <DataCard title="Week of Year" value={`W${Math.ceil(dayOfYear / 7)}`} />
                <DataCard title="Year" value={now.getFullYear().toString()} highlight={isLeapYear(now.getFullYear())} />
                <DataCard title="Leap Year" value={isLeapYear(now.getFullYear()) ? "✓ Yes" : "No"} sub={`Next: ${leap.next}`} highlight={isLeapYear(now.getFullYear())} />
                <DataCard title="Days Remaining" value={`${totalDays - dayOfYear}`} sub="days left" />
              </div>
            </div>
          </section>

          {/* ── CHINESE LUNISOLAR CALENDAR ── */}
          <section>
            <SectionTitle sub="Traditional Chinese calendar with zodiac animals">Chinese Lunisolar Calendar</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <DataCard title="Chinese Year" value={chinese.year.toString()} icon="🏮" />
              <DataCard title="Zodiac Animal" value={`${chineseAnimals[chinese.animal] || "🐲"} ${chinese.animal}`} highlight />
              <DataCard title="Element" value={chinese.element} icon="☯️" />
              <DataCard title="Lunar Month" value={chinese.monthName} sub={`Day ${chinese.dayNum}`} />
            </div>
            <div className="rounded-xl border bg-card border-border p-4">
              <div className="text-xs mb-3 tracking-widest uppercase text-muted-foreground">12-Year Zodiac Cycle</div>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                {animalList.map((animal, i) => {
                  const active = animal === chinese.animal;
                  return (
                    <div key={animal} className={`flex flex-col items-center gap-1 p-1 rounded border transition-colors ${active ? "bg-primary/10 border-primary/40" : "border-transparent"}`}>
                      <span className="text-lg">{chineseAnimals[animal]}</span>
                      <span className={`text-xs hidden sm:block ${active ? "text-primary" : "text-muted-foreground"}`}>{animal}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <DataCard title="Leap Cycle" value="19 years" sub="Metonic cycle" icon="🔄" />
              <DataCard title="Lunar Year" value="354/355 days" sub="Per lunar year" icon="📆" />
              <DataCard title="Intercalation" value="~7/19 years" sub="Leap months added" icon="➕" />
            </div>
          </section>

          {/* ── ZODIAC DISPLAY ── */}
          <section>
            <SectionTitle sub="Western astronomical zodiac">Zodiac Display</SectionTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="rounded-xl border bg-card border-border p-6 flex flex-col items-center justify-center flex-shrink-0 min-w-[140px]">
                <div className="text-5xl mb-2">{zodiac.symbol}</div>
                <div className="text-lg font-bold text-primary">{zodiac.sign}</div>
                <div className="text-xs mt-1 text-muted-foreground">{zodiac.element}</div>
                <div className="text-xs mt-0.5 text-muted-foreground">From {zodiac.startDate}</div>
              </div>
              <div className="flex-1 grid grid-cols-6 gap-1.5">
                {["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"].map((sym, i) => {
                  const signs = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
                  const active = signs[i] === zodiac.sign;
                  return (
                    <div key={i} className={`rounded-lg p-2 text-center border transition-colors ${active ? "bg-primary/10 border-primary/40" : "bg-muted border-border"}`}>
                      <div className={`text-xl ${active ? "text-primary" : "text-muted-foreground"}`}>{sym}</div>
                      <div className={`text-xs mt-0.5 hidden sm:block ${active ? "text-primary" : "text-muted-foreground"}`}>{signs[i]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-3">
              <DataCard title="Sun's Position" value={`${fmtNum(sun.declination, 2)}° Declination`}
                sub={`Right Ascension: ${fmtNum(sun.rightAscension, 2)}°`} icon="☀️" />
            </div>
          </section>

          {/* ── SUNRISE & SUNSET ── */}
          <section>
            <SectionTitle sub={`Calculated for ${location.name} — updates live with GPS`}>Sunrise & Sunset</SectionTitle>
            <div className="rounded-xl border bg-card border-border p-4 mb-3">
              <svg width="100%" height="100" viewBox="0 0 300 100" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="skyDay" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary) / 0.3)" />
                    <stop offset="100%" stopColor="hsl(var(--background))" />
                  </linearGradient>
                </defs>
                <rect width="300" height="100" fill="url(#skyDay)" />
                <line x1={0} y1={80} x2={300} y2={80} stroke="hsl(var(--border))" strokeWidth="1" />
                <path d="M 20 80 Q 150 10 280 80" fill="none" stroke="hsl(var(--primary) / 0.4)" strokeWidth="1" strokeDasharray="4 3" />
                {(() => {
                  const totalMins = (sunset.getTime() - sunrise.getTime()) / 60000;
                  const elapsedMins = (now.getTime() - sunrise.getTime()) / 60000;
                  const t = Math.max(0, Math.min(1, elapsedMins / totalMins));
                  const x = 20 + t * 260;
                  const arc = -70 * Math.sin(t * Math.PI);
                  const y = 80 + arc;
                  return t >= 0 && t <= 1 ? (
                    <g>
                      <circle cx={x} cy={y} r={10} fill="hsl(var(--primary) / 0.2)" />
                      <circle cx={x} cy={y} r={6} fill="hsl(var(--primary))" />
                      <circle cx={x} cy={y} r={3} fill="hsl(var(--primary-foreground))" />
                    </g>
                  ) : null;
                })()}
                <text x={20} y={96} fill="hsl(var(--primary))" fontSize="9" textAnchor="middle">🌅 {fmt(sunrise)}</text>
                <text x={280} y={96} fill="hsl(var(--muted-foreground))" fontSize="9" textAnchor="middle">🌇 {fmt(sunset)}</text>
                <text x={150} y={18} fill="hsl(var(--foreground))" fontSize="9" textAnchor="middle">Alt: {fmtNum(sun.altitude, 1)}° Az: {fmtNum(sun.azimuth, 1)}°</text>
              </svg>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <DataCard title="Sunrise" value={fmt(sunrise)} icon="🌅" highlight />
              <DataCard title="Sunset" value={fmt(sunset)} icon="🌇" highlight />
              <DataCard title="Day Length" value={`${fmtNum(daylength, 2)}h`} icon="⏱️" />
              <DataCard title="Solar Altitude" value={`${fmtNum(sun.altitude, 2)}°`} sub={sun.altitude > 0 ? "Above horizon" : "Below horizon"} />
            </div>
          </section>

          {/* ── EQUATION OF TIME ── */}
          <section>
            <SectionTitle sub="Difference between civil & apparent solar time">Equation of Time</SectionTitle>
            <div className="rounded-xl border bg-card border-border p-4 mb-3">
              <EquationOfTimeChart currentEoT={eot} dayOfYear={dayOfYear} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <DataCard title="EoT Value" value={`${eot >= 0 ? "+" : ""}${fmtNum(eot, 2)} min`}
                sub="Solar vs clock" icon="⏰" highlight />
              <DataCard title="Apparent Solar Time" value={solarTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} icon="☀️" />
              <DataCard title="Civil Time" value={now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} icon="🕐" />
            </div>
          </section>

          {/* ── SIDEREAL TIME ── */}
          <section>
            <SectionTitle sub="Star time — Earth's rotation relative to distant stars">Sidereal Time</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border bg-card border-border p-4">
                <div className="text-xs mb-2 uppercase tracking-widest text-muted-foreground">Local Sidereal Time</div>
                <div className="text-4xl font-mono font-bold tabular-nums text-primary">
                  {pad(sidH)}h {pad(sidM)}m {pad(sidS)}s
                </div>
                <div className="text-xs mt-2 text-muted-foreground">= {fmtNum(sid, 4)}°</div>
                <div className="text-xs mt-1 text-muted-foreground">
                  Sidereal day = 23h 56m 4.09s — 3m 56s shorter than solar day
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DataCard title="GMST" value={`${fmtNum(siderealTime(now, 0), 2)}°`} sub="Greenwich" />
                <DataCard title="LMST" value={`${fmtNum(sid, 2)}°`} sub="Local" highlight />
                <DataCard title="Solar vs Sidereal" value="+3m 56s/day" sub="Sidereal shorter" />
                <DataCard title="RA on Meridian" value={`${pad(sidH)}h ${pad(sidM)}m`} sub="Right Ascension" />
              </div>
            </div>
          </section>

          {/* ── STAR CHART / SKY CHART ── */}
          <section>
            <SectionTitle sub="Live star positions rotating with local sidereal time">Star Chart & Sky Map</SectionTitle>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="rounded-xl border bg-card border-border p-3 flex-shrink-0">
                <StarChartSVG siderealDeg={sid} lat={location.lat} />
                <div className="text-center text-xs mt-2 text-muted-foreground">Rotating with LST • {fmtNum(sid, 1)}°</div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="text-xs uppercase tracking-widest mb-2 text-muted-foreground">Brightest Stars</div>
                {STARS.slice(0, 10).map(star => {
                  const isVisible = star.dec + 90 > (90 - location.lat);
                  return (
                    <div key={star.name} className="flex items-center justify-between text-xs py-1.5 border-b border-border">
                      <span className="text-foreground font-medium">★ {star.name}</span>
                      <span className="text-muted-foreground">Mag {star.mag.toFixed(2)}</span>
                      <span className={isVisible ? "text-success" : "text-destructive"}>
                        {isVisible ? "Visible" : "Below horizon"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── SEASONS & EQUINOXES ── */}
          <section>
            <SectionTitle sub="Earth's orbital position and astronomical seasons">Seasons & Equinoxes</SectionTitle>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <SeasonalWheel date={now} />
              <div className="flex-1 grid grid-cols-2 gap-3">
                <DataCard title="Current Season" value={`${season.icon} ${season.name}`} highlight />
                <DataCard title="Season Progress" value={`${(season.progress * 100).toFixed(1)}%`} />
                <DataCard title="Spring Equinox" value="~Mar 20" icon="🌸" />
                <DataCard title="Summer Solstice" value="~Jun 21" icon="☀️" />
                <DataCard title="Autumn Equinox" value="~Sep 23" icon="🍂" />
                <DataCard title="Winter Solstice" value="~Dec 21" icon="❄️" />
              </div>
            </div>
            <div className="mt-4 rounded-xl border bg-card border-border p-4">
              <div className="text-xs mb-2 uppercase tracking-widest text-muted-foreground">Solar Declination (−23.5° to +23.5°)</div>
              <div className="relative h-5 rounded-full overflow-hidden bg-muted">
                <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
                <div className="absolute w-3 h-3 rounded-full bg-primary top-1/2 -translate-y-1/2 -translate-x-1/2 shadow-lg"
                  style={{ left: `${((sun.declination + 23.5) / 47) * 100}%` }} />
              </div>
              <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                <span>−23.5° Winter Solstice</span>
                <span className="font-bold text-primary">{fmtNum(sun.declination, 2)}°</span>
                <span>+23.5° Summer Solstice</span>
              </div>
            </div>
          </section>

          {/* ── SOLAR TIME ── */}
          <section>
            <SectionTitle sub="Apparent vs mean solar time">Solar Time vs Civil Time</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border bg-card border-border p-4">
                <div className="text-xs mb-1 uppercase tracking-widest text-muted-foreground">Apparent Solar Time</div>
                <div className="text-3xl font-mono font-bold text-primary">
                  {solarTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </div>
                <div className="text-xs mt-2 text-muted-foreground">Sun's actual position + longitude correction</div>
              </div>
              <div className="rounded-xl border bg-card border-border p-4">
                <div className="text-xs mb-1 uppercase tracking-widest text-muted-foreground">Mean Civil Time</div>
                <div className="text-3xl font-mono font-bold text-foreground">
                  {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </div>
                <div className="text-xs mt-2 text-muted-foreground">Standard timezone time</div>
              </div>
            </div>
            <div className="mt-3">
              <DataCard title="Time Difference" value={`${eot >= 0 ? "+" : ""}${fmtNum(eot, 2)} minutes`}
                sub="Solar time offset from clock" icon="⚖️" />
            </div>
          </section>

          {/* ── TOURBILLON REGULATOR ── */}
          <section>
            <SectionTitle sub="60 rpm precision regulating mechanism — live animation">Tourbillon Regulator</SectionTitle>
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="flex flex-col items-center gap-2">
                <TourbillonSVG angle={tourbillonAngle} />
                <div className="text-xs text-center text-muted-foreground">Live • 60 rpm • Gravity compensation</div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <DataCard title="Rotation Speed" value="60 rpm" sub="1 rev/second" icon="⚙️" />
                <DataCard title="Beat Rate" value="21,600 vph" sub="3 Hz" icon="💓" highlight />
                <DataCard title="Cage Weight" value="~0.3g" sub="Featherlight" icon="⚖️" />
                <DataCard title="Escapement" value="Swiss Lever" sub="Traditional" />
                <DataCard title="Power Reserve" value="~65 hours" sub="Hand-wound" icon="🔋" />
                <DataCard title="Pivot Count" value="72" sub="Pivot points in cage" icon="🔩" />
              </div>
            </div>
          </section>

          {/* ── WESTMINSTER MINUTE REPEATER ── */}
          <section>
            <SectionTitle sub="4-gong chiming — strikes hours, quarters, minutes">Westminster Minute Repeater</SectionTitle>
            <div className="rounded-xl border bg-card border-border p-6">
              <WestminsterChime minute={now.getMinutes()} second={now.getSeconds()} />
              <Divider />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <DataCard title="Current Hour" value={`${pad(now.getHours() % 12 || 12)}h`} icon="🔔" />
                <DataCard title="Quarter" value={`Q${Math.floor(now.getMinutes() / 15) + 1}`} sub="of 4 per hour" />
                <DataCard title="Minutes Past" value={`${now.getMinutes() % 15}m`} sub="After quarter" />
                <DataCard title="Chime" value="E♭-C-D-G" sub="Westminster pattern" highlight />
              </div>
              <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                The Westminster chime uses 4 notes (E♭, C, D, G). Each quarter plays a distinct pattern building to the full 16-note sequence at the top of the hour, followed by the hour count struck on the low-G gong.
              </p>
            </div>
          </section>

          {/* ── FOOTER ── */}
          <div className="text-center py-8 border-t border-border">
            <p className="text-xs text-muted-foreground italic tracking-widest">
              "A masterpiece of time, astronomy, and human craftsmanship."
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Vacheron Constantin Les Cabinotiers — The Berkley Grand Complication
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
