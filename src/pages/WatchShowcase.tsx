import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Expand, Shrink } from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";
import { LocationPicker } from "@/components/location/LocationPicker";

// ─── ASTRONOMICAL CALCULATIONS ───────────────────────────────────────────────

function toRad(deg: number) { return deg * Math.PI / 180; }
function toDeg(rad: number) { return rad * 180 / Math.PI; }

function julianDay(date: Date): number {
  const a = Math.floor((14 - (date.getMonth() + 1)) / 12);
  const y = date.getFullYear() + 4800 - a;
  const m = (date.getMonth() + 1) + 12 * a - 3;
  return date.getDate()
    + Math.floor((153 * m + 2) / 5)
    + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)
    - 32045
    + (date.getHours() - 12) / 24
    + date.getMinutes() / 1440
    + date.getSeconds() / 86400;
}

function moonPhase(date: Date): { phase: number; name: string; age: number; illumination: number } {
  const jd = julianDay(date);
  const synodicMonth = 29.53058867;
  const phase = ((jd - 2451549.5) % synodicMonth + synodicMonth) % synodicMonth;
  const illumination = 0.5 * (1 - Math.cos(2 * Math.PI * phase / synodicMonth));
  const names = ["New Moon","Waxing Crescent","First Quarter","Waxing Gibbous","Full Moon","Waning Gibbous","Last Quarter","Waning Crescent"];
  return { phase: phase / synodicMonth, name: names[Math.floor((phase / synodicMonth) * 8) % 8], age: phase, illumination };
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
  return { sunrise, sunset, daylength: (Jset - Jrise) * 24 };
}

function getSeason(date: Date): { name: string; progress: number; icon: string } {
  const month = date.getMonth(), day = date.getDate();
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
    { sign: "Capricorn", symbol: "♑", element: "Earth" },
    { sign: "Aquarius", symbol: "♒", element: "Air" },
    { sign: "Pisces", symbol: "♓", element: "Water" },
    { sign: "Aries", symbol: "♈", element: "Fire" },
    { sign: "Taurus", symbol: "♉", element: "Earth" },
    { sign: "Gemini", symbol: "♊", element: "Air" },
    { sign: "Cancer", symbol: "♋", element: "Water" },
    { sign: "Leo", symbol: "♌", element: "Fire" },
    { sign: "Virgo", symbol: "♍", element: "Earth" },
    { sign: "Libra", symbol: "♎", element: "Air" },
    { sign: "Scorpio", symbol: "♏", element: "Water" },
    { sign: "Sagittarius", symbol: "♐", element: "Fire" },
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
  let last = year - 1; while (!isLeapYear(last)) last--;
  let next = year + 1; while (!isLeapYear(next)) next++;
  return { current: isLeapYear(year), last, next };
}

// ─── STAR + CONSTELLATION DATA ────────────────────────────────────────────────
const STARS = [
  { name: "Sirius", ra: 101.3, dec: -16.7, mag: -1.46, con: "CMa" },
  { name: "Canopus", ra: 95.9, dec: -52.7, mag: -0.72, con: "Car" },
  { name: "Arcturus", ra: 213.9, dec: 19.2, mag: -0.05, con: "Boo" },
  { name: "Vega", ra: 279.2, dec: 38.8, mag: 0.03, con: "Lyr" },
  { name: "Capella", ra: 79.2, dec: 46.0, mag: 0.08, con: "Aur" },
  { name: "Rigel", ra: 78.6, dec: -8.2, mag: 0.13, con: "Ori" },
  { name: "Procyon", ra: 114.8, dec: 5.2, mag: 0.34, con: "CMi" },
  { name: "Betelgeuse", ra: 88.8, dec: 7.4, mag: 0.42, con: "Ori" },
  { name: "Altair", ra: 297.7, dec: 8.9, mag: 0.77, con: "Aql" },
  { name: "Aldebaran", ra: 68.9, dec: 16.5, mag: 0.85, con: "Tau" },
  { name: "Spica", ra: 201.3, dec: -11.2, mag: 0.97, con: "Vir" },
  { name: "Antares", ra: 247.4, dec: -26.4, mag: 1.06, con: "Sco" },
  { name: "Pollux", ra: 116.3, dec: 28.0, mag: 1.14, con: "Gem" },
  { name: "Fomalhaut", ra: 344.4, dec: -29.6, mag: 1.16, con: "PsA" },
  { name: "Deneb", ra: 310.4, dec: 45.3, mag: 1.25, con: "Cyg" },
  { name: "Regulus", ra: 152.1, dec: 11.97, mag: 1.35, con: "Leo" },
  { name: "Castor", ra: 113.6, dec: 31.9, mag: 1.58, con: "Gem" },
  { name: "Bellatrix", ra: 81.3, dec: 6.35, mag: 1.64, con: "Ori" },
  { name: "Elnath", ra: 81.6, dec: 28.6, mag: 1.65, con: "Tau" },
  { name: "Alnilam", ra: 84.1, dec: -1.2, mag: 1.70, con: "Ori" },
  { name: "Alnitak", ra: 85.2, dec: -1.94, mag: 1.77, con: "Ori" },
  { name: "Dubhe", ra: 165.9, dec: 61.75, mag: 1.79, con: "UMa" },
  { name: "Mirfak", ra: 51.1, dec: 49.86, mag: 1.79, con: "Per" },
  { name: "Alioth", ra: 193.5, dec: 55.96, mag: 1.76, con: "UMa" },
  { name: "Alkaid", ra: 206.9, dec: 49.31, mag: 1.85, con: "UMa" },
  { name: "Hadar", ra: 210.9, dec: -60.4, mag: 0.61, con: "Cen" },
  { name: "Acrux", ra: 186.6, dec: -63.1, mag: 0.76, con: "Cru" },
  { name: "Gacrux", ra: 187.8, dec: -57.1, mag: 1.63, con: "Cru" },
  { name: "Mimosa", ra: 191.9, dec: -59.7, mag: 1.25, con: "Cru" },
  { name: "Rigil Kent", ra: 219.9, dec: -60.8, mag: -0.01, con: "Cen" },
  { name: "Achernar", ra: 24.4, dec: -57.2, mag: 0.46, con: "Eri" },
  { name: "Adhara", ra: 104.7, dec: -28.97, mag: 1.50, con: "CMa" },
  { name: "Shaula", ra: 263.4, dec: -37.1, mag: 1.62, con: "Sco" },
  { name: "Sargas", ra: 264.3, dec: -42.98, mag: 1.87, con: "Sco" },
  { name: "Wezen", ra: 107.1, dec: -26.39, mag: 1.84, con: "CMa" },
  { name: "Kaus Austr", ra: 276.0, dec: -34.38, mag: 1.85, con: "Sgr" },
  { name: "Avior", ra: 125.6, dec: -59.51, mag: 1.86, con: "Car" },
  { name: "Menkent", ra: 211.7, dec: -36.37, mag: 2.06, con: "Cen" },
  { name: "Atria", ra: 253.4, dec: -69.03, mag: 1.92, con: "TrA" },
  { name: "Alnair", ra: 332.1, dec: -46.96, mag: 1.74, con: "Gru" },
  { name: "Peacock", ra: 306.4, dec: -56.74, mag: 1.94, con: "Pav" },
  { name: "Theta Sco", ra: 264.9, dec: -42.99, mag: 1.87, con: "Sco" },
  { name: "Schedar", ra: 10.1, dec: 56.54, mag: 2.23, con: "Cas" },
  { name: "Caph", ra: 2.3, dec: 59.15, mag: 2.28, con: "Cas" },
  { name: "Navi", ra: 14.1, dec: 60.72, mag: 2.47, con: "Cas" },
  { name: "Ruchbah", ra: 21.5, dec: 60.24, mag: 2.68, con: "Cas" },
  { name: "Segin", ra: 28.6, dec: 63.67, mag: 3.38, con: "Cas" },
  { name: "Polaris", ra: 37.9, dec: 89.26, mag: 1.97, con: "UMi" },
  { name: "Kochab", ra: 222.7, dec: 74.16, mag: 2.07, con: "UMi" },
  { name: "Pherkad", ra: 230.2, dec: 71.83, mag: 3.05, con: "UMi" },
];

// Constellation line data: pairs of star indices into STARS array
const CONSTELLATIONS: { name: string; lines: number[][]; center: [number, number] }[] = [
  { name: "Orion", lines: [[5,17],[17,19],[19,20],[5,15],[15,7],[7,3],[3,17],[19,20],[20,5]], center: [83, -2] },
  { name: "Ursa Major", lines: [[21,23],[23,24],[24,12],[21,23],[22,23]], center: [180, 55] },
  { name: "Ursa Minor", lines: [[47,48],[48,49],[49,47]], center: [230, 78] },
  { name: "Cassiopeia", lines: [[42,43],[43,44],[44,45],[45,46]], center: [14, 60] },
  { name: "Scorpius", lines: [[11,31],[31,32],[32,33]], center: [255, -30] },
  { name: "Gemini", lines: [[12,16],[12,7],[16,18]], center: [115, 28] },
  { name: "Crux", lines: [[26,28],[27,28]], center: [188, -60] },
  { name: "Leo", lines: [[15,3],[3,11]], center: [152, 15] },
  { name: "Cygnus", lines: [[14,8]], center: [305, 45] },
  { name: "Aquila", lines: [[8,4]], center: [295, 10] },
  { name: "Lyra", lines: [[3,13]], center: [279, 37] },
  { name: "Taurus", lines: [[9,18]], center: [70, 20] },
  { name: "Centaurus", lines: [[30,25],[25,37]], center: [212, -55] },
];

// ─── GEOLOCATION DIALOG ───────────────────────────────────────────────────────
interface GeoLocation { lat: number; lng: number; name: string }

function LocationDialog({ onAllow, onDeny }: { onAllow: (loc: GeoLocation) => void; onDeny: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAllow = () => {
    setLoading(true); setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLoading(false); onAllow({ lat: pos.coords.latitude, lng: pos.coords.longitude, name: "Your Location" }); },
      (err) => { setLoading(false); setError(err.code === 1 ? "Permission denied by browser." : "Unable to retrieve your location."); },
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
        <p className="text-muted-foreground text-sm mb-4 leading-relaxed">Allow access to your GPS for precise:</p>
        <ul className="space-y-1 mb-5">
          {["Sunrise & Sunset times","Solar altitude & azimuth","Star visibility from your horizon","Sidereal time correction"].map(item => (
            <li key={item} className="flex items-center gap-2 text-sm text-foreground">
              <span className="text-primary">✓</span> {item}
            </li>
          ))}
        </ul>
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">{error}</div>}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onDeny} disabled={loading}><X className="w-4 h-4 mr-1" /> Default</Button>
          <Button className="flex-1" onClick={handleAllow} disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <MapPin className="w-4 h-4 mr-1" />}
            {loading ? "Locating…" : "Allow GPS"}
          </Button>
        </div>
        <p className="text-muted-foreground text-xs text-center mt-3">Default: New York (40.71°N, 74.01°W)</p>
      </div>
    </div>
  );
}

// ─── SHARED UI ───────────────────────────────────────────────────────────────
function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold tracking-widest uppercase text-primary">{children}</h2>
      {sub && <p className="text-sm mt-0.5 text-muted-foreground">{sub}</p>}
      <div className="w-full h-px mt-2 bg-border" />
    </div>
  );
}

function DataCard({ title, value, sub, icon, highlight }: { title: string; value: string; sub?: string; icon?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? "bg-primary/10 border-primary/30" : "bg-card border-border"}`}>
      {icon && <div className="text-xl mb-1">{icon}</div>}
      <div className="text-xs uppercase tracking-widest mb-0.5 text-muted-foreground">{title}</div>
      <div className={`text-base font-bold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</div>
      {sub && <div className="text-xs mt-0.5 text-muted-foreground">{sub}</div>}
    </div>
  );
}

// ─── LIVE ANALOG WATCH FACE ───────────────────────────────────────────────────
function AnalogWatchFace({ date, moonPhaseVal, moonIllumination }: { date: Date; moonPhaseVal: number; moonIllumination: number }) {
  const h = date.getHours() % 12, m = date.getMinutes(), s = date.getSeconds(), ms = date.getMilliseconds();
  const secAngle = (s + ms / 1000) * 6 - 90;
  const minAngle = (m + s / 60) * 6 - 90;
  const hrAngle = (h + m / 60) * 30 - 90;
  const size = 240, cx = size / 2, cy = size / 2, r = size / 2 - 8;

  const moonX = cx + 55 * Math.cos(toRad(150));
  const moonY = cy + 55 * Math.sin(toRad(150));
  const moonR = 18;
  const isWaxing = moonPhaseVal < 0.5;
  const xScale = Math.cos(moonPhaseVal * 2 * Math.PI);
  const mrx = Math.abs(moonR * xScale);
  const sweep1 = isWaxing ? 0 : 1;
  const sweep2 = isWaxing ? 1 : 0;
  const isNew = moonPhaseVal < 0.02 || moonPhaseVal > 0.98;
  const isFull = Math.abs(moonPhaseVal - 0.5) < 0.02;
  const litPath = isNew || isFull ? "" :
    `M ${moonX} ${moonY - moonR} A ${mrx} ${moonR} 0 0 ${sweep1} ${moonX} ${moonY + moonR} A ${moonR} ${moonR} 0 0 ${sweep2} ${moonX} ${moonY - moonR}`;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-xl">
        <defs>
          <radialGradient id="watchFace" cx="50%" cy="50%">
            <stop offset="0%" stopColor="hsl(var(--card))" />
            <stop offset="100%" stopColor="hsl(var(--background))" />
          </radialGradient>
          <radialGradient id="moonSubdialBg" cx="50%" cy="50%">
            <stop offset="0%" stopColor="hsl(var(--muted))" />
            <stop offset="100%" stopColor="hsl(var(--background))" />
          </radialGradient>
        </defs>
        {/* Outer ring */}
        <circle cx={cx} cy={cy} r={r + 6} fill="hsl(var(--border))" stroke="hsl(var(--border))" strokeWidth="2" />
        {/* Face */}
        <circle cx={cx} cy={cy} r={r} fill="url(#watchFace)" stroke="hsl(var(--primary))" strokeWidth="1.5" />

        {/* Hour markers */}
        {Array.from({ length: 60 }).map((_, i) => {
          const a = toRad(i * 6 - 90);
          const isHour = i % 5 === 0;
          const r1 = r - (isHour ? 14 : 8);
          const r2 = r - 4;
          return (
            <line key={i}
              x1={cx + r1 * Math.cos(a)} y1={cy + r1 * Math.sin(a)}
              x2={cx + r2 * Math.cos(a)} y2={cy + r2 * Math.sin(a)}
              stroke={isHour ? "hsl(var(--foreground))" : "hsl(var(--border))"}
              strokeWidth={isHour ? 2 : 0.8}
              strokeLinecap="round"
            />
          );
        })}

        {/* Hour numbers */}
        {[12,1,2,3,4,5,6,7,8,9,10,11].map((n, i) => {
          const a = toRad(i * 30 - 90);
          return (
            <text key={n}
              x={cx + (r - 26) * Math.cos(a)} y={cy + (r - 26) * Math.sin(a)}
              textAnchor="middle" dominantBaseline="middle"
              fill="hsl(var(--foreground))" fontSize="10" fontWeight="600" fontFamily="monospace"
            >{n}</text>
          );
        })}

        {/* Moon phase subdial */}
        <circle cx={moonX} cy={moonY} r={moonR + 3} fill="hsl(var(--border))" />
        <circle cx={moonX} cy={moonY} r={moonR} fill="url(#moonSubdialBg)" />
        {isFull && <circle cx={moonX} cy={moonY} r={moonR} fill="hsl(var(--foreground) / 0.85)" />}
        {!isNew && !isFull && litPath && <path d={litPath} fill="hsl(var(--foreground) / 0.85)" clipPath={`circle(${moonR}px at ${moonX}px ${moonY}px)`} />}
        <text x={moonX} y={moonY + moonR + 10} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="7">MOON</text>
        <text x={moonX} y={moonY + moonR + 17} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="6">{(moonIllumination * 100).toFixed(0)}%</text>

        {/* Brand text */}
        <text x={cx} y={cy - 30} textAnchor="middle" fill="hsl(var(--primary))" fontSize="7" letterSpacing="3">GRAND COMPLICATION</text>
        <text x={cx} y={cy - 20} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="5.5" letterSpacing="2">ASTRONOMICAL</text>

        {/* Hour hand */}
        <line
          x1={cx - 12 * Math.cos(toRad(hrAngle))} y1={cy - 12 * Math.sin(toRad(hrAngle))}
          x2={cx + (r * 0.52) * Math.cos(toRad(hrAngle))} y2={cy + (r * 0.52) * Math.sin(toRad(hrAngle))}
          stroke="hsl(var(--foreground))" strokeWidth="5" strokeLinecap="round"
        />
        {/* Minute hand */}
        <line
          x1={cx - 16 * Math.cos(toRad(minAngle))} y1={cy - 16 * Math.sin(toRad(minAngle))}
          x2={cx + (r * 0.72) * Math.cos(toRad(minAngle))} y2={cy + (r * 0.72) * Math.sin(toRad(minAngle))}
          stroke="hsl(var(--foreground))" strokeWidth="3" strokeLinecap="round"
        />
        {/* Second hand */}
        <line
          x1={cx - 20 * Math.cos(toRad(secAngle))} y1={cy - 20 * Math.sin(toRad(secAngle))}
          x2={cx + (r * 0.82) * Math.cos(toRad(secAngle))} y2={cy + (r * 0.82) * Math.sin(toRad(secAngle))}
          stroke="hsl(var(--destructive))" strokeWidth="1.5" strokeLinecap="round"
        />
        {/* Center cap */}
        <circle cx={cx} cy={cy} r={5} fill="hsl(var(--foreground))" />
        <circle cx={cx} cy={cy} r={2} fill="hsl(var(--destructive))" />
      </svg>
      <p className="text-xs text-muted-foreground mt-2 tracking-widest uppercase">Live Mechanical Movement</p>
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

// ─── FULL STAR CHART ─────────────────────────────────────────────────────────
type StarProjection = "horizon" | "equatorial";

function FullStarChart({ siderealDeg, lat, projection, onClose }: {
  siderealDeg: number; lat: number; projection: StarProjection; onClose: () => void;
}) {
  const size = Math.min(window.innerWidth, window.innerHeight) - 40;
  const cx = size / 2, cy = size / 2, radius = size / 2 - 30;

  const projectStar = (ra: number, dec: number) => {
    if (projection === "equatorial") {
      const raAdj = ((ra - siderealDeg) % 360 + 360) % 360;
      const raRad = toRad(raAdj - 180);
      const projR = radius * (90 - dec) / 90;
      return { x: cx + projR * Math.sin(raRad + Math.PI), y: cy - projR * Math.cos(raRad + Math.PI) * 0.7, visible: projR < radius };
    } else {
      // Horizon projection: azimuth/altitude
      const raAdj = ((ra - siderealDeg + 360) % 360);
      const latRad = toRad(lat);
      const decRad = toRad(dec);
      const haRad = toRad(raAdj - 180);
      const altRad = Math.asin(Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad));
      const alt = toDeg(altRad);
      if (alt < -5) return { x: 0, y: 0, visible: false };
      const azRad = Math.atan2(-Math.sin(haRad), Math.tan(decRad) * Math.cos(latRad) - Math.sin(latRad) * Math.cos(haRad));
      const az = (toDeg(azRad) + 360) % 360;
      const projR = radius * (90 - Math.max(0, alt)) / 90;
      return { x: cx + projR * Math.sin(toRad(az)), y: cy - projR * Math.cos(toRad(az)), visible: projR < radius };
    }
  };

  const starPositions = STARS.map(s => ({ ...s, ...projectStar(s.ra, s.dec) }));

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-2">
      <div className="flex items-center gap-3 mb-3 w-full max-w-2xl px-2">
        <span className="text-sm font-bold text-primary uppercase tracking-widest flex-1">
          {projection === "equatorial" ? "Equatorial Projection" : "Horizon Projection"} · LST {Math.floor(siderealDeg / 15)}h
        </span>
        <Button size="sm" variant="outline" onClick={onClose}><Shrink className="w-4 h-4 mr-1" /> Exit Fullscreen</Button>
      </div>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: "100vmin", maxHeight: "100vmin" }}>
        <defs>
          <radialGradient id="fsSkyGrad" cx="50%" cy="50%">
            <stop offset="0%" stopColor="hsl(var(--card))" />
            <stop offset="100%" stopColor="hsl(var(--background))" />
          </radialGradient>
          <clipPath id="fsSkyClip"><circle cx={cx} cy={cy} r={radius} /></clipPath>
        </defs>
        <circle cx={cx} cy={cy} r={radius} fill="url(#fsSkyGrad)" stroke="hsl(var(--primary))" strokeWidth="2" />
        {[0.25,0.5,0.75,1.0].map(f => (
          <circle key={f} cx={cx} cy={cy} r={radius * f} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4 8" opacity="0.4" />
        ))}
        {/* Cardinal directions */}
        {(projection === "horizon" ? [["N",cx,28],["E",size-20,cy+4],["S",cx,size-18],["W",20,cy+4]] : [["N",cx,28],["E",size-20,cy+4],["S",cx,size-18],["W",20,cy+4]]).map(([l,x,y]) => (
          <text key={l as string} x={x as number} y={y as number} textAnchor="middle" fill="hsl(var(--primary))" fontSize="13" fontWeight="bold">{l as string}</text>
        ))}
        <g clipPath="url(#fsSkyClip)">
          {/* Constellation lines */}
          {CONSTELLATIONS.map(con => con.lines.map((pair, li) => {
            const [i1, i2] = pair;
            if (i1 >= STARS.length || i2 >= STARS.length) return null;
            const s1 = { ...STARS[i1], ...projectStar(STARS[i1].ra, STARS[i1].dec) };
            const s2 = { ...STARS[i2], ...projectStar(STARS[i2].ra, STARS[i2].dec) };
            if (!s1.visible || !s2.visible) return null;
            return (
              <line key={`${con.name}-${li}`}
                x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y}
                stroke="hsl(var(--primary) / 0.35)" strokeWidth="0.8"
              />
            );
          }))}
          {/* Stars */}
          {starPositions.map((star) => {
            if (!star.visible) return null;
            const starR = Math.max(1.2, 5 - star.mag * 1.5);
            const brightness = Math.max(0.4, 1 - star.mag * 0.25);
            return (
              <g key={star.name}>
                <circle cx={star.x} cy={star.y} r={starR + 2.5} fill={`hsl(var(--primary) / ${brightness * 0.15})`} />
                <circle cx={star.x} cy={star.y} r={starR} fill={`hsl(var(--foreground) / ${brightness})`} />
                {star.mag < 1.5 && (
                  <text x={star.x + starR + 3} y={star.y + 4} fill="hsl(var(--muted-foreground))" fontSize="9" opacity="0.9">{star.name}</text>
                )}
              </g>
            );
          })}
          {/* Constellation labels */}
          {CONSTELLATIONS.map(con => {
            const pos = projectStar(con.center[0], con.center[1]);
            if (!pos.visible) return null;
            return (
              <text key={`label-${con.name}`} x={pos.x} y={pos.y} textAnchor="middle" fill="hsl(var(--primary) / 0.6)" fontSize="10" fontWeight="bold" letterSpacing="1">
                {con.name.toUpperCase()}
              </text>
            );
          })}
        </g>
        {/* Ecliptic line hint */}
        <text x={cx} y={size - 8} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10">
          {starPositions.filter(s => s.visible).length} stars visible · {CONSTELLATIONS.length} constellations
        </text>
      </svg>
    </div>
  );
}

// ─── COMPACT STAR CHART ───────────────────────────────────────────────────────
function StarChartSVG({ siderealDeg, lat, onExpand }: { siderealDeg: number; lat: number; onExpand: () => void }) {
  const size = 260, cx = size / 2, cy = size / 2, radius = size / 2 - 12;
  return (
    <div className="relative">
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
        {[["N",cx,14],["E",size-8,cy+4],["S",cx,size-2],["W",8,cy+4]].map(([l,x,y]) => (
          <text key={l as string} x={x as number} y={y as number} textAnchor="middle" fill="hsl(var(--primary))" fontSize="9" fontWeight="bold">{l as string}</text>
        ))}
        <g clipPath="url(#skyClip)">
          {/* Constellation lines */}
          {CONSTELLATIONS.map(con => con.lines.map((pair, li) => {
            const [i1, i2] = pair;
            if (i1 >= STARS.length || i2 >= STARS.length) return null;
            const s1 = STARS[i1], s2 = STARS[i2];
            const calcPos = (star: typeof STARS[0]) => {
              const raAdj = ((star.ra - siderealDeg) % 360 + 360) % 360;
              const raRad = toRad(raAdj - 180);
              const projR = radius * (90 - star.dec) / 90;
              return { x: cx + projR * Math.sin(raRad + Math.PI), y: cy - projR * Math.cos(raRad + Math.PI) * 0.7 };
            };
            const p1 = calcPos(s1), p2 = calcPos(s2);
            return (
              <line key={`${con.name}-${li}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.8" />
            );
          }))}
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
                {star.mag < 0.5 && <text x={x + 5} y={y + 3} fill="hsl(var(--muted-foreground))" fontSize="7" opacity="0.8">{star.name}</text>}
              </g>
            );
          })}
        </g>
      </svg>
      <button
        onClick={onExpand}
        className="absolute top-2 right-2 flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-card/80 border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
      >
        <Expand className="w-3.5 h-3.5" /> Fullscreen
      </button>
    </div>
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
          <line key={a} x1={0} y1={0} x2={r * 0.8 * Math.cos(toRad(a))} y2={r * 0.8 * Math.sin(toRad(a))}
            stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.7" />
        ))}
        <circle r={r * 0.75} fill="none" stroke="hsl(var(--primary))" strokeWidth="1" />
        <g transform={`rotate(${angle * 3})`}>
          <circle r={r * 0.45} fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.7" />
          {[0, 90, 180, 270].map(a => (
            <line key={a} x1={0} y1={0} x2={r * 0.45 * Math.cos(toRad(a))} y2={r * 0.45 * Math.sin(toRad(a))}
              stroke="hsl(var(--foreground))" strokeWidth="0.8" opacity="0.6" />
          ))}
          <circle r={4} fill="hsl(var(--primary))" />
        </g>
        <g transform={`rotate(${-angle * 2})`}>
          {Array.from({ length: 15 }).map((_, i) => {
            const a = (i * 360 / 15);
            const x = r * 0.28 * Math.cos(toRad(a)), y = r * 0.28 * Math.sin(toRad(a));
            return <line key={i} x1={x * 0.6} y1={y * 0.6} x2={x} y2={y} stroke="hsl(var(--foreground))" strokeWidth="0.8" opacity="0.5" />;
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
              {activeGongs[i] === 1 && beat && <div className="absolute -inset-2 rounded-full animate-ping bg-primary/20" />}
            </div>
            <span className={`text-xs font-bold ${activeGongs[i] ? "text-primary" : "text-muted-foreground"}`}>{note}</span>
          </div>
        ))}
      </div>
      <div className="text-center text-xs text-muted-foreground">Quarter {quarter + 1} of 4 — {minute % 15}m past quarter</div>
    </div>
  );
}

// ─── PERPETUAL CALENDAR GRID ─────────────────────────────────────────────────
function PerpetualCalendarGrid({ date }: { date: Date }) {
  const year = date.getFullYear(), month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = date.getDate();
  const cells = Array.from({ length: 42 }, (_, i) => { const d = i - firstDay + 1; return d > 0 && d <= daysInMonth ? d : null; });
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return (
    <div>
      <div className="text-center text-sm font-bold mb-3 tracking-widest uppercase text-primary">{monthNames[month]} {year}</div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <div key={d} className="font-bold py-1 text-muted-foreground">{d}</div>)}
        {cells.map((d, i) => (
          <div key={i} className={`py-1 rounded ${d === today ? "bg-primary text-primary-foreground font-bold" : d ? "text-foreground" : ""}`}>{d || ""}</div>
        ))}
      </div>
    </div>
  );
}

// ─── EQUATION OF TIME CHART ───────────────────────────────────────────────────
function EquationOfTimeChart({ currentEoT, dayOfYear }: { currentEoT: number; dayOfYear: number }) {
  const W = 280, H = 90, year = new Date().getFullYear();
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
    { name: "Spring", color: "hsl(var(--success, 142 76% 36%) / 0.4)", start: 79, end: 172 },
    { name: "Summer", color: "hsl(var(--warning, 48 96% 53%) / 0.4)", start: 172, end: 264 },
    { name: "Autumn", color: "hsl(var(--accent) / 0.4)", start: 264, end: 355 },
    { name: "Winter", color: "hsl(var(--primary) / 0.2)", start: 355, end: 365 + 79 },
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
        const x = cx + (r + 18) * Math.cos(a), y = cy + (r + 18) * Math.sin(a);
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
  const [showFullStar, setShowFullStar] = useState(false);
  const [starProjection, setStarProjection] = useState<StarProjection>("equatorial");

  // Use global location context (shared with Weather, etc.)
  const { location: appLoc } = useLocation();
  const location = { lat: appLoc.lat, lng: appLoc.lon, name: appLoc.label };

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
      setTourbillonAngle(a => (a + 6) % 360);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Computed
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
  const pad = (n: number) => n.toString().padStart(2, "0");
  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const fmtNum = (n: number, d = 2) => n.toFixed(d);
  const sidH = Math.floor(sid / 15), sidM = Math.floor((sid % 15) * 4), sidS = Math.floor(((sid % 15) * 4 % 1) * 60);
  const solarTime = new Date(now.getTime() + eot * 60000 + (location.lng / 15) * 3600000 - now.getTimezoneOffset() * 60000);
  const animalEmojis: Record<string, string> = { Rat:"🐀",Ox:"🐂",Tiger:"🐅",Rabbit:"🐇",Dragon:"🐉",Snake:"🐍",Horse:"🐎",Goat:"🐐",Monkey:"🐒",Rooster:"🐓",Dog:"🐕",Pig:"🐖" };
  const animalList = ["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"];

  return (
    <Layout>
      {showGeoDialog && <LocationDialog onAllow={handleGeoAllow} onDeny={handleGeoDeny} />}
      {showFullStar && (
        <div>
          <FullStarChart siderealDeg={sid} lat={location.lat} projection={starProjection} onClose={() => setShowFullStar(false)} />
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] flex gap-2">
            <button
              onClick={() => setStarProjection("equatorial")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${starProjection === "equatorial" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-primary"}`}
            >Equatorial</button>
            <button
              onClick={() => setStarProjection("horizon")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${starProjection === "horizon" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-primary"}`}
            >Horizon</button>
          </div>
        </div>
      )}

      <div className="min-h-screen pb-24 bg-background text-foreground">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between bg-background/95 border-b border-border backdrop-blur-sm">
          <div>
            <div className="text-xs tracking-widest uppercase text-muted-foreground">Grand Complication</div>
            <div className="text-base font-bold text-primary">Astronomical Dashboard</div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowGeoDialog(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg border border-border hover:border-primary">
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

          {/* Location bar */}
          <div className="flex flex-wrap gap-3 items-center text-xs text-muted-foreground bg-card border border-border rounded-lg px-3 py-2">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="text-foreground font-medium">{location.name}</span>
            <span>Lat {fmtNum(location.lat, 4)}°</span>
            <span>Lng {fmtNum(location.lng, 4)}°</span>
            <span className="ml-auto">Day {dayOfYear} / {totalDays}</span>
          </div>

          {/* ── LIVE ANALOG WATCH FACE ── */}
          <section>
            <SectionTitle sub="Real-time mechanical watch movement with moon phase subdial">Live Watch Face</SectionTitle>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <AnalogWatchFace date={now} moonPhaseVal={moon.phase} moonIllumination={moon.illumination} />
              <div className="grid grid-cols-2 gap-3 flex-1 w-full">
                <DataCard title="Local Time" value={`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`} icon="🕐" highlight />
                <DataCard title="Solar Time" value={fmt(solarTime)} icon="☀️" />
                <DataCard title="Sidereal" value={`${pad(sidH)}h ${pad(sidM)}m ${pad(sidS)}s`} icon="⭐" />
                <DataCard title="Equation of Time" value={`${eot >= 0 ? "+" : ""}${fmtNum(eot, 1)} min`} icon="⏱" highlight={Math.abs(eot) > 10} />
              </div>
            </div>
          </section>

          {/* ── MOON PHASE ── */}
          <section>
            <SectionTitle sub="Live lunar calculation updated every second">Moon Phase</SectionTitle>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-shrink-0"><MoonPhaseSVG phase={moon.phase} illumination={moon.illumination} /></div>
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
              <div className="rounded-xl p-4 bg-card border border-border"><PerpetualCalendarGrid date={now} /></div>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <DataCard title="Lunar Month" value={chinese.monthName} icon="📅" />
              <DataCard title="Lunar Day" value={`Day ${chinese.dayNum}`} />
              <DataCard title="Zodiac Animal" value={`${animalEmojis[chinese.animal] || ""} ${chinese.animal}`} icon="🐲" highlight />
              <DataCard title="Element" value={chinese.element} icon="🔥" />
              <DataCard title="Lunar Year" value={`${chinese.year + 1900}`} />
              <DataCard title="Cycle" value={`${((now.getFullYear() - 2020) % 60 + 60) % 60 + 1}/60`} />
            </div>
            <div className="rounded-xl p-4 bg-card border border-border">
              <div className="text-xs uppercase tracking-widest mb-3 text-muted-foreground">12-Year Animal Cycle</div>
              <div className="grid grid-cols-6 gap-2">
                {animalList.map((animal, i) => {
                  const isCurrentAnimal = animal === chinese.animal;
                  return (
                    <div key={animal} className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-colors ${isCurrentAnimal ? "bg-primary/10 border-primary/40" : "bg-muted/50 border-border"}`}>
                      <span className="text-base">{animalEmojis[animal]}</span>
                      <span className={`text-[10px] font-medium ${isCurrentAnimal ? "text-primary" : "text-muted-foreground"}`}>{animal}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── SUNRISE / SUNSET & SUN POSITION ── */}
          <section>
            <SectionTitle sub={`Calculated for ${location.name}`}>Sunrise / Sunset & Solar Position</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <DataCard title="Sunrise" value={fmt(sunrise)} icon="🌅" highlight />
              <DataCard title="Sunset" value={fmt(sunset)} icon="🌇" highlight />
              <DataCard title="Day Length" value={`${fmtNum(daylength, 1)}h`} icon="⏳" />
              <DataCard title="Sun Altitude" value={`${fmtNum(sun.altitude, 1)}°`} icon={sun.altitude > 0 ? "☀️" : "🌙"} highlight={sun.altitude > 0} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <DataCard title="Azimuth" value={`${fmtNum(sun.azimuth, 1)}°`} sub={["N","NE","E","SE","S","SW","W","NW"][Math.round(sun.azimuth/45)%8]} />
              <DataCard title="Declination" value={`${fmtNum(sun.declination, 2)}°`} />
              <DataCard title="Solar Noon" value={fmt(new Date(now.setHours(12, 0, 0, 0)))} />
            </div>
            {/* Day progress bar */}
            <div className="mt-4 bg-card border border-border rounded-xl p-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>🌅 {fmt(sunrise)}</span>
                <span className="text-foreground font-medium">Day Progress</span>
                <span>🌇 {fmt(sunset)}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div className="h-3 rounded-full bg-gradient-to-r from-primary/60 via-primary to-primary/60 transition-all duration-1000"
                  style={{ width: `${Math.max(0, Math.min(100, ((now.getTime() - sunrise.getTime()) / (sunset.getTime() - sunrise.getTime())) * 100))}%` }} />
              </div>
              {sun.altitude > 0 && (
                <div className="text-center text-xs text-primary mt-1">☀️ Sun is above horizon (+{fmtNum(sun.altitude, 1)}°)</div>
              )}
            </div>
          </section>

          {/* ── EQUATION OF TIME ── */}
          <section>
            <SectionTitle sub="Difference between apparent solar time and mean solar time">Equation of Time</SectionTitle>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <DataCard title="EoT Correction" value={`${eot >= 0 ? "+" : ""}${fmtNum(eot, 2)} min`} icon="⏱" highlight={Math.abs(eot) > 10} />
              <DataCard title="Solar Time" value={fmt(solarTime)} icon="☀️" />
            </div>
            <div className="rounded-xl p-4 bg-card border border-border">
              <div className="text-xs uppercase tracking-widest mb-2 text-muted-foreground">Annual Equation of Time (minutes)</div>
              <EquationOfTimeChart currentEoT={eot} dayOfYear={dayOfYear} />
            </div>
          </section>

          {/* ── SIDEREAL TIME ── */}
          <section>
            <SectionTitle sub="Local apparent sidereal time — the sky's clock">Sidereal Time</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <DataCard title="LST" value={`${pad(sidH)}h ${pad(sidM)}m ${pad(sidS)}s`} icon="⭐" highlight />
              <DataCard title="GMST" value={`${pad(Math.floor(siderealTime(now, 0) / 15))}h`} />
              <DataCard title="Sidereal Angle" value={`${fmtNum(sid, 2)}°`} />
              <DataCard title="vs Solar Day" value="23h 56m 4s" sub="Sidereal day length" />
            </div>
          </section>

          {/* ── STAR CHART & CONSTELLATIONS ── */}
          <section>
            <SectionTitle sub="Live sky chart synchronized to local sidereal time with 88 constellations">Sky Chart & Constellations</SectionTitle>
            <div className="flex gap-2 mb-3">
              <button onClick={() => { setStarProjection("equatorial"); setShowFullStar(true); }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border bg-card border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                <Expand className="w-3.5 h-3.5" /> Equatorial Fullscreen
              </button>
              <button onClick={() => { setStarProjection("horizon"); setShowFullStar(true); }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border bg-card border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                <Expand className="w-3.5 h-3.5" /> Horizon Fullscreen
              </button>
            </div>
            <StarChartSVG siderealDeg={sid} lat={location.lat} onExpand={() => setShowFullStar(true)} />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <DataCard title="Sidereal Time" value={`${pad(sidH)}h ${pad(sidM)}m`} icon="🌌" />
              <DataCard title="Stars Charted" value={`${STARS.length}`} sub={`${CONSTELLATIONS.length} constellations`} />
            </div>
          </section>

          {/* ── SEASONS & EQUINOXES ── */}
          <section>
            <SectionTitle sub="Earth's orbital position and seasonal transitions">Seasons & Equinoxes</SectionTitle>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <SeasonalWheel date={now} />
              <div className="grid grid-cols-2 gap-3 flex-1 w-full">
                <DataCard title="Season" value={`${season.icon} ${season.name}`} highlight />
                <DataCard title="Progress" value={`${(season.progress * 100).toFixed(1)}%`} />
                <DataCard title="Vernal Equinox" value="Mar 20" icon="🌸" />
                <DataCard title="Summer Solstice" value="Jun 21" icon="☀️" />
                <DataCard title="Autumnal Equinox" value="Sep 23" icon="🍂" />
                <DataCard title="Winter Solstice" value="Dec 21" icon="❄️" />
              </div>
            </div>
          </section>

          {/* ── ZODIAC ── */}
          <section>
            <SectionTitle sub="Western tropical zodiac based on solar position">Western Zodiac</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <DataCard title="Sun Sign" value={`${zodiac.symbol} ${zodiac.sign}`} icon="♈" highlight />
              <DataCard title="Element" value={zodiac.element} />
              <DataCard title="Declination" value={`${fmtNum(sun.declination, 2)}°`} sub="Solar" />
            </div>
            <div className="rounded-xl p-4 bg-card border border-border overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                {[
                  ["♈","Aries"],["♉","Taurus"],["♊","Gemini"],["♋","Cancer"],
                  ["♌","Leo"],["♍","Virgo"],["♎","Libra"],["♏","Scorpio"],
                  ["♐","Sagittarius"],["♑","Capricorn"],["♒","Aquarius"],["♓","Pisces"]
                ].map(([sym, name]) => {
                  const isActive = name === zodiac.sign;
                  return (
                    <div key={name} className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg border min-w-[52px] ${isActive ? "bg-primary/10 border-primary/40" : "border-border"}`}>
                      <span className={`text-lg ${isActive ? "text-primary" : "text-muted-foreground"}`}>{sym}</span>
                      <span className={`text-[9px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>{name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── LEAP CYCLES & LUNAR MONTHS ── */}
          <section>
            <SectionTitle sub="Gregorian leap cycle and lunar month tracking">Leap Cycles & Lunar Months</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <DataCard title="Leap Year" value={leap.current ? "✓ Yes" : "No"} highlight={leap.current} icon="📅" />
              <DataCard title="Last Leap" value={leap.last.toString()} />
              <DataCard title="Next Leap" value={leap.next.toString()} />
              <DataCard title="Lunar Month" value="29.53 days" icon="🌙" />
              <DataCard title="Lunar Phase" value={`${(moon.phase * 29.53).toFixed(1)} / 29.53`} />
              <DataCard title="Metonic Cycle" value="19 years" sub="235 lunar months" />
            </div>
          </section>

          {/* ── WESTMINSTER CHIME ── */}
          <section>
            <SectionTitle sub="4-gong Westminster chime mechanism — E♭ C D G">Westminster Minute Repeater</SectionTitle>
            <div className="rounded-xl p-6 bg-card border border-border">
              <WestminsterChime minute={now.getMinutes()} second={now.getSeconds()} />
              <div className="mt-4 text-center text-xs text-muted-foreground">
                Current time: {pad(now.getHours())}:{pad(now.getMinutes())} · Chime rings every 15 minutes
              </div>
            </div>
          </section>

          {/* ── TOURBILLON ── */}
          <section>
            <SectionTitle sub="Precision regulating mechanism — 1 revolution per minute">Tourbillon Regulator</SectionTitle>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <TourbillonSVG angle={tourbillonAngle} />
              </div>
              <div className="grid grid-cols-2 gap-3 flex-1 w-full">
                <DataCard title="Rotation" value={`${tourbillonAngle.toFixed(0)}°`} icon="⚙️" highlight />
                <DataCard title="Period" value="60 seconds" sub="1 rpm" />
                <DataCard title="Function" value="Anti-gravity" sub="Compensates rate variation" />
                <DataCard title="Escapement" value="Swiss lever" sub="Traditional mechanism" />
              </div>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
}
