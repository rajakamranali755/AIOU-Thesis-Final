import LandingNav from "./LandingNav";
import Hero from "./Hero";
import LogoTicker from "./LogoTicker";
import BentoFeatures from "./BentoFeatures";
import FeatureCarousel from "./FeatureCarousel";
import MetricSlider from "./MetricSlider";
import CommunityDiscussions from "./CommunityDiscussions";
import FinalCTA from "./FinalCTA";
import { GraduationCap } from "lucide-react";

/**
 * LandingPage
 * Self-contained marketing page. Drop it anywhere; it inherits the project's
 * theme through the semantic tokens defined in index.css (:root) and
 * tailwind.config.js. `onLaunch` is called by every primary CTA.
 *
 * Section order: Nav → Hero (3D) → Ticker → Bento → Carousel → Metric slider → CTA → Footer.
 */
export default function LandingPage({ onLaunch = () => {} }) {
  return (
    <div className="relative min-h-screen text-foreground antialiased">
      {/* Ambient themed background — replaces the flat white. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-transparent to-accent/[0.09]" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[900px] rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl opacity-60" />
        <div className="absolute top-1/3 -right-40 h-[420px] w-[420px] rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute bottom-24 -left-40 h-[420px] w-[420px] rounded-full bg-primary/15 blur-3xl" />
      </div>

      <LandingNav onLaunch={onLaunch} />

      <main>
        <Hero onLaunch={onLaunch} />
        <LogoTicker />
        <BentoFeatures />
        <FeatureCarousel />
        <MetricSlider />
        <CommunityDiscussions onLaunch={onLaunch} />
        <FinalCTA onLaunch={onLaunch} />
      </main>

      <footer className="border-t border-border bg-background/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground">Academic Writing Suite</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Thesis &amp; article builder · References · Research search · Scholar Hub
          </p>
          <button onClick={onLaunch} className="text-xs font-bold text-primary hover:underline">
            Open the app →
          </button>
        </div>
      </footer>
    </div>
  );
}
