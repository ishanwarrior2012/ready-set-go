import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HelpCircle, ExternalLink } from "lucide-react";

const faqs = [
  {
    q: "What is SafeTrack?",
    a: "SafeTrack is a real-time global monitoring Progressive Web App (PWA) that lets you track flights, marine vessels, earthquakes, volcanoes, tsunamis, ISS position, weather, and more — all in one place.",
  },
  {
    q: "How do I track a flight?",
    a: "Go to the Flights section from the dashboard or bottom navigation. You can view live flights on the map and tap any aircraft icon for details including altitude, speed, and route.",
  },
  {
    q: "How does the earthquake monitor work?",
    a: "The Earthquake Monitor fetches data from the USGS Earthquake API. You can filter by magnitude, time range, and location. Tap any earthquake marker for detailed seismic data.",
  },
  {
    q: "Can I receive alerts for natural disasters?",
    a: "Yes! Go to Settings → Notifications and enable alerts for earthquakes, volcanoes, weather, and more. You'll receive push notifications when significant events occur.",
  },
  {
    q: "What is the Chill section?",
    a: "Chill is an entertainment hub within SafeTrack where you can browse movies and relax. It includes a DNS safety guide to help protect your browsing with AdGuard Family DNS.",
  },
  {
    q: "How do I change the theme?",
    a: "Go to Settings and you'll find Appearance Mode (Light/Dark/System) and Color Theme options with 12+ unique color palettes to choose from.",
  },
  {
    q: "Does SafeTrack work offline?",
    a: "SafeTrack is a PWA with offline support. Enable Offline Mode in Settings → Data & Privacy to cache data for offline viewing. Some features require an internet connection for live data.",
  },
  {
    q: "How do I change the language?",
    a: "Go to Settings → Regional → Language. SafeTrack supports 180+ languages. Search for your language and select it.",
  },
  {
    q: "What is the ISS Tracker?",
    a: "The ISS Tracker shows the live position of the International Space Station, its current crew members, orbital speed, altitude, and real-time coordinates updated every few seconds.",
  },
  {
    q: "How do I use SafeTrack on my TV?",
    a: "SafeTrack is optimized for TV displays with larger touch targets and D-pad navigation support. Use apps like AppMySite to wrap SafeTrack as a native app for Smart TVs.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your preferences and favorites are stored securely. Profile data is protected with row-level security. We never share your personal data with third parties.",
  },
  {
    q: "How do I report a bug or give feedback?",
    a: "Use the Contact Support option in Settings to send us a message. We appreciate all feedback to improve SafeTrack.",
  },
  {
    q: "What marine data can I track?",
    a: "The Marine Traffic section shows live vessel positions, ship types, routes, and port information. You can filter vessels by type and view detailed ship information.",
  },
  {
    q: "How accurate is the weather data?",
    a: "Weather data is sourced from OpenWeatherMap and NOAA, providing highly accurate current conditions, forecasts, and weather map layers including wind, temperature, and precipitation.",
  },
];

export function HelpFAQ() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="font-medium">Help & FAQ</p>
            <p className="text-sm text-muted-foreground">Get help and answers</p>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Help & Frequently Asked Questions
          </DialogTitle>
        </DialogHeader>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-sm">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </DialogContent>
    </Dialog>
  );
}
